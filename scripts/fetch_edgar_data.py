#!/usr/bin/env python3
"""Fetch SEC EDGAR 13F and Form 4 data into static JSON for GitHub Pages."""

from __future__ import annotations

import datetime as dt
import html
import json
import pathlib
import re
import sys
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Any

import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
EDGAR_DIR = DATA_DIR / "edgar"
FILER_JSON_DIR = DATA_DIR / "filers"
FILER_HTML_DIR = ROOT / "filers"
HOLDINGS_PAGE = ROOT / "holdings" / "index.html"

SEC_HEADERS = {
    "User-Agent": "ioinnovationfund.com filings bot (contact@ioinnovationfund.com)",
    "Accept-Encoding": "gzip, deflate",
    "Host": "data.sec.gov",
}

ARCHIVES_HEADERS = {
    "User-Agent": "ioinnovationfund.com filings bot (contact@ioinnovationfund.com)",
    "Accept-Encoding": "gzip, deflate",
    "Host": "www.sec.gov",
}

BTC_TICKERS = {
    "IBIT",
    "FBTC",
    "GBTC",
    "ARKB",
    "BITB",
    "HODL",
    "BRRR",
    "EZBC",
    "BTCW",
    "DEFI",
}

ISSUER_TO_TICKER = {
    "APPLE INC": "AAPL",
    "MICROSOFT CORP": "MSFT",
    "AMAZON COM INC": "AMZN",
    "ALPHABET INC": "GOOGL",
    "ALPHABET INC CAP STK CL A": "GOOGL",
    "ALPHABET INC CAP STK CL C": "GOOG",
    "META PLATFORMS INC": "META",
    "NVIDIA CORP": "NVDA",
    "BERKSHIRE HATHAWAY INC DEL": "BRK.B",
    "TESLA INC": "TSLA",
    "NETFLIX INC": "NFLX",
    "BLACKROCK INC": "BLK",
    "SPDR S&P 500 ETF TR": "SPY",
    "INVESCO QQQ TRUST": "QQQ",
    "ISHARES TR": "IVV",
    "ISHARES BITCOIN TRUST ETF": "IBIT",
    "FIDELITY WISE ORIGIN BIT FD": "FBTC",
    "GRAYSCALE BITCOIN TRUST": "GBTC",
}


def _sleep():
    time.sleep(0.15)


def _get_json(url: str, headers: dict[str, str]) -> dict[str, Any]:
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    _sleep()
    return resp.json()


def _get_text(url: str, headers: dict[str, str]) -> str:
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    _sleep()
    return resp.text


def _safe_float(value: str | None) -> float:
    if value is None:
        return 0.0
    cleaned = value.replace(",", "").strip()
    if not cleaned:
        return 0.0
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _norm_issuer(name: str) -> str:
    return re.sub(r"\s+", " ", name.upper()).strip()


def _infer_ticker(issuer_name: str, title_of_class: str) -> str:
    norm = _norm_issuer(issuer_name)
    if norm in ISSUER_TO_TICKER:
        return ISSUER_TO_TICKER[norm]

    if "BITCOIN" in norm:
        if "ISHARES" in norm:
            return "IBIT"
        if "FIDELITY" in norm:
            return "FBTC"
        if "GRAYSCALE" in norm:
            return "GBTC"

    title = title_of_class.upper().strip()
    if title in BTC_TICKERS:
        return title

    return ""


def _has_btc_exposure(issuer_name: str, ticker: str) -> bool:
    name = issuer_name.upper()
    return ("BITCOIN" in name) or (ticker in BTC_TICKERS)


def _txt(node: ET.Element, tag: str) -> str:
    found = node.find(f".//{{*}}{tag}")
    return found.text.strip() if found is not None and found.text else ""


def _find_first(recent_forms: list[str], *candidates: str) -> int | None:
    candidate_set = set(candidates)
    for idx, value in enumerate(recent_forms):
        if value in candidate_set:
            return idx
    return None


@dataclass
class FilerResult:
    filer: dict[str, Any]
    filing_date: str
    report_period: str
    accession: str
    filing_url: str
    holdings: list[dict[str, Any]]


def fetch_latest_13f(filer: dict[str, Any]) -> FilerResult | None:
    cik = filer["cik"]
    sub_url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    sub = _get_json(sub_url, SEC_HEADERS)

    recent = sub.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    idx = _find_first(forms, "13F-HR", "13F-HR/A")
    if idx is None:
        return None

    accession = recent["accessionNumber"][idx]
    accession_nodash = accession.replace("-", "")
    filing_date = recent["filingDate"][idx]
    report_period = recent.get("reportDate", [""] * len(forms))[idx]
    primary_document = recent.get("primaryDocument", [""] * len(forms))[idx]

    cik_num = str(int(cik))
    filing_url = f"https://www.sec.gov/Archives/edgar/data/{cik_num}/{accession_nodash}/{primary_document}"
    index_url = f"https://www.sec.gov/Archives/edgar/data/{cik_num}/{accession_nodash}/index.json"
    index_json = _get_json(index_url, ARCHIVES_HEADERS)

    item_names = [
        item.get("name", "")
        for item in index_json.get("directory", {}).get("item", [])
        if item.get("name")
    ]

    xml_candidates = [
        name
        for name in item_names
        if name.lower().endswith(".xml") and "infotable" in name.lower()
    ]
    if not xml_candidates:
        xml_candidates = [name for name in item_names if name.lower().endswith(".xml")]
    if not xml_candidates:
        return None

    info_table_name = sorted(xml_candidates)[0]
    info_url = f"https://www.sec.gov/Archives/edgar/data/{cik_num}/{accession_nodash}/{info_table_name}"
    xml_text = _get_text(info_url, ARCHIVES_HEADERS)

    root = ET.fromstring(xml_text)
    holdings: list[dict[str, Any]] = []

    info_tables = [
        node
        for node in root.iter()
        if node.tag.lower().endswith("infotable")
    ]

    for row in info_tables:
        issuer = _txt(row, "nameOfIssuer")
        title = _txt(row, "titleOfClass")
        cusip = _txt(row, "cusip")
        value_reported = _safe_float(_txt(row, "value"))
        shares = _safe_float(_txt(row, "sshPrnamt"))
        put_call = _txt(row, "putCall")
        discretion = _txt(row, "investmentDiscretion")

        ticker = _infer_ticker(issuer, title)
        holdings.append(
            {
                "issuer": issuer,
                "title_of_class": title,
                "cusip": cusip,
                "ticker": ticker,
                "value_usd": int(value_reported),
                "shares": int(shares),
                "put_call": put_call,
                "discretion": discretion,
                "btc_tag": _has_btc_exposure(issuer, ticker),
            }
        )

    holdings.sort(key=lambda x: x["value_usd"], reverse=True)
    total_value = sum(item["value_usd"] for item in holdings) or 1
    for item in holdings:
        item["weight_pct"] = round(item["value_usd"] * 100 / total_value, 3)

    return FilerResult(
        filer=filer,
        filing_date=filing_date,
        report_period=report_period,
        accession=accession,
        filing_url=filing_url,
        holdings=holdings,
    )


def fetch_recent_form4(issuer: dict[str, Any], max_items: int = 8) -> list[dict[str, Any]]:
    cik = issuer["cik"]
    sub_url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    sub = _get_json(sub_url, SEC_HEADERS)
    recent = sub.get("filings", {}).get("recent", {})

    forms = recent.get("form", [])
    accessions = recent.get("accessionNumber", [])
    filing_dates = recent.get("filingDate", [])
    primary_docs = recent.get("primaryDocument", [])

    out: list[dict[str, Any]] = []

    for idx, form in enumerate(forms):
        if form not in {"4", "4/A"}:
            continue
        if idx >= len(accessions) or idx >= len(primary_docs):
            continue

        accession = accessions[idx]
        accession_nodash = accession.replace("-", "")
        cik_num = str(int(cik))
        filing_url = f"https://www.sec.gov/Archives/edgar/data/{cik_num}/{accession_nodash}/{primary_docs[idx]}"

        out.append(
            {
                "issuer_slug": issuer["slug"],
                "issuer_name": issuer["name"],
                "form": form,
                "filing_date": filing_dates[idx] if idx < len(filing_dates) else "",
                "accession": accession,
                "filing_url": filing_url,
            }
        )
        if len(out) >= max_items:
            break

    return out


def write_json(path: pathlib.Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def money(value: int) -> str:
    return f"${value:,.0f}"


def render_filer_html(summary: dict[str, Any], holdings: list[dict[str, Any]], generated_at: str) -> str:
    rows = []
    for item in holdings[:40]:
        btc = "<span class=\"tag tag-btc\">BTC-linked</span>" if item.get("btc_tag") else ""
        ticker = item.get("ticker") or "-"
        rows.append(
            "<tr>"
            f"<td>{html.escape(item.get('issuer', '-'))}</td>"
            f"<td>{html.escape(ticker)}</td>"
            f"<td>{money(int(item.get('value_usd', 0)))}</td>"
            f"<td>{item.get('weight_pct', 0):.2f}%</td>"
            f"<td>{btc}</td>"
            "</tr>"
        )

    table_html = "\n".join(rows) if rows else "<tr><td colspan=\"5\">No holdings parsed for this filing.</td></tr>"

    filer_name = html.escape(summary["name"])
    filer_slug = html.escape(summary["slug"])
    filing_url = html.escape(summary.get("filing_url", "#") or "#")
    report_period = summary.get("report_period", "") or ""
    filing_date = summary.get("filing_date", "") or ""
    data_as_of = filing_date or generated_at[:10]

    return f"""<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>{filer_name} Holdings | IO Innovation Filings</title>
    <meta name=\"description\" content=\"Latest 13F holdings snapshot for {filer_name}, including top positions and BTC-linked exposures.\" />
    <link rel=\"canonical\" href=\"https://ioinnovationfund.com/filers/{filer_slug}.html\" />
    <meta property=\"og:type\" content=\"article\" />
    <meta property=\"og:title\" content=\"{filer_name} Holdings Snapshot\" />
    <meta property=\"og:description\" content=\"Top holdings from the latest 13F filing for {filer_name}.\" />
    <meta property=\"og:url\" content=\"https://ioinnovationfund.com/filers/{filer_slug}.html\" />
    <meta property=\"og:image\" content=\"https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg\" />
    <meta property=\"og:image:alt\" content=\"IO Innovation Filings institutional holdings dashboard\" />
    <meta property=\"og:site_name\" content=\"IO Innovation Filings\" />
    <meta name=\"twitter:card\" content=\"summary\" />
    <meta name=\"twitter:title\" content=\"{filer_name} 13F holdings\" />
    <meta name=\"twitter:description\" content=\"Top holdings and BTC-linked disclosures from the latest filing.\" />
    <meta name=\"twitter:image\" content=\"https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg\" />
    <meta name=\"twitter:image:alt\" content=\"IO Innovation Filings institutional holdings dashboard\" />
    <meta name=\"robots\" content=\"index, follow\" />
    <link rel=\"preconnect\" href=\"https://pagead2.googlesyndication.com\" crossorigin />
    <link rel=\"preconnect\" href=\"https://googleads.g.doubleclick.net\" crossorigin />

    <script type=\"application/ld+json\">{{"@context":"https://schema.org","@type":"Organization","name":"IO Innovation Filings","url":"https://ioinnovationfund.com/","logo":"https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg"}}</script>
    <script type=\"application/ld+json\">{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"Home","item":"https://ioinnovationfund.com/"}},{{"@type":"ListItem","position":2,"name":"Filers","item":"https://ioinnovationfund.com/filers/"}},{{"@type":"ListItem","position":3,"name":"{filer_name}","item":"https://ioinnovationfund.com/filers/{filer_slug}.html"}}]}}</script>
    <script type=\"application/ld+json\">{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{{"@type":"Question","name":"What does {filer_name} hold?","acceptedAnswer":{{"@type":"Answer","text":"This page summarizes top disclosed U.S. equity positions from the latest available 13F filing for {filer_name}."}}}}]}}</script>
    <script src=\"/js/theme-init.js?v=2026060801\"></script>
    <link rel=\"stylesheet\" href=\"/css/site.css?v=2026071302\" />
    <link rel=\"stylesheet\" href=\"/css/holdings.css?v=2026081801\" />
  </head>
  <body>
    <a href=\"#main\" class=\"skip-to-main\">Skip to content</a>
    <header class=\"header\">
      <nav class=\"nav\">
        <a href=\"/\" class=\"logo\">IO Innovation Filings</a>
        <ul class=\"nav-links\" id=\"mobileNav\">
          <li><a href=\"/\">Home</a></li>
          <li><a href=\"/holdings/\" class=\"active\">Holdings</a></li>
          <li><a href=\"/filers/\">Filers</a></li>
          <li><a href=\"/blog/\">Blog</a></li>
          <li><a href=\"/about.html\">About</a></li>
          <li><a href=\"/contact.html\">Contact</a></li>
        </ul>
        <div class=\"nav-actions\">
          <button id=\"themeToggle\" class=\"theme-toggle\" aria-label=\"Toggle theme\"><i id=\"themeIcon\" class=\"theme-icon fas fa-moon\"></i></button>
          <button class=\"mobile-menu-btn\" id=\"menuBtn\" aria-label=\"Toggle menu\"><span></span><span></span><span></span></button>
        </div>
      </nav>
    </header>

    <main id=\"main\" class=\"page-shell\">
      <section class=\"hero-panel\">
        <span class=\"hero-kicker\">Filer Snapshot</span>
        <h1 class=\"hero-title\">{html.escape(summary['name'])}</h1>
        <p class=\"hero-subtitle\">Latest 13F-HR parsed from SEC EDGAR. This page is regenerated from committed static data after each scheduled refresh.</p>
        <div class=\"inline-meta\">
                    <span>Report period: {html.escape(report_period or '-')}</span>
                    <span>Filed: {html.escape(filing_date or '-')}</span>
                    <span>Data as of: {html.escape(data_as_of)}</span>
          <span>Total reported value: {money(int(summary.get('total_value_usd', 0)))}</span>
                    <a href=\"{filing_url}\" rel=\"nofollow noopener\" target=\"_blank\">SEC filing</a>
        </div>
      </section>

      <section class=\"table-wrap\" aria-label=\"Top holdings\">
        <table class=\"data-table\">
          <thead>
            <tr>
              <th>Issuer</th>
              <th>Ticker</th>
              <th>Value (USD)</th>
              <th>Weight</th>
              <th>BTC tag</th>
            </tr>
          </thead>
          <tbody>
            {table_html}
          </tbody>
        </table>
      </section>
            <section class=\"hero-panel\" style=\"margin-top: 1rem\">
                <h2 style=\"font-size: 1.1rem\">Methodology and disclaimer</h2>
                <p class=\"hero-subtitle\">Source filing links point to SEC EDGAR. Data may include parser or ticker-mapping errors. Verify critical details in the original filing.</p>
                <p class=\"muted\">Not investment advice. Not affiliated with the separate \"I/O Fund\" newsletter. See <a href=\"/methodology.html\">methodology</a>.</p>
            </section>
    </main>

    <footer class=\"footer\" role=\"contentinfo\">
      <div class=\"footer-content\">
        <div class=\"footer-bottom\"><p>&copy; {dt.datetime.now().year} IO Innovation. Educational data utility.</p></div>
      </div>
    </footer>
    <script src=\"/js/shared-simple.js?v=2026071302\"></script>
  </body>
</html>
"""


def generate_filer_pages(filers_summary: list[dict[str, Any]], by_slug: dict[str, list[dict[str, Any]]]) -> None:
    FILER_HTML_DIR.mkdir(parents=True, exist_ok=True)

    for summary in filers_summary:
        slug = summary["slug"]
        holdings = by_slug.get(slug, [])
        html_doc = render_filer_html(
            summary,
            holdings,
            dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        )
        (FILER_HTML_DIR / f"{slug}.html").write_text(html_doc, encoding="utf-8")


def render_filers_index(filers_summary: list[dict[str, Any]]) -> str:
    cards = []
    for filer in filers_summary:
        cards.append(
            "<a class=\"filer-card\" href=\"/{}/{}.html\">"
            "<h3>{}</h3>"
            "<p class=\"muted\">Latest report period: {}</p>"
            "<p class=\"muted\">Total reported value: {}</p>"
            "</a>".format(
                "filers",
                html.escape(filer["slug"]),
                html.escape(filer["name"]),
                html.escape(filer.get("report_period", "-") or "-"),
                money(int(filer.get("total_value_usd", 0))),
            )
        )

    card_html = "\n".join(cards)

    generated_on = dt.datetime.now(dt.timezone.utc).date().isoformat()

    return f"""<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>Tracked Filers | IO Innovation Filings</title>
    <meta name=\"description\" content=\"Tracked institutions with latest 13F snapshots and filer detail pages.\" />
    <link rel=\"canonical\" href=\"https://ioinnovationfund.com/filers/\" />
    <meta property=\"og:type\" content=\"website\" />
    <meta property=\"og:title\" content=\"Tracked Filers\" />
    <meta property=\"og:description\" content=\"Institutional filings tracker with static filer pages.\" />
    <meta property=\"og:url\" content=\"https://ioinnovationfund.com/filers/\" />
    <meta property=\"og:image\" content=\"https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg\" />
    <meta property=\"og:image:alt\" content=\"IO Innovation Filings institutional holdings dashboard\" />
    <meta property=\"og:site_name\" content=\"IO Innovation Filings\" />
    <meta name=\"twitter:card\" content=\"summary_large_image\" />
    <meta name=\"twitter:image\" content=\"https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg\" />
    <meta name=\"twitter:image:alt\" content=\"IO Innovation Filings institutional holdings dashboard\" />
    <meta name=\"robots\" content=\"index, follow\" />
    <script type=\"application/ld+json\">{{"@context":"https://schema.org","@type":"Organization","name":"IO Innovation Filings","url":"https://ioinnovationfund.com/","logo":"https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg"}}</script>
    <script type=\"application/ld+json\">{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"Home","item":"https://ioinnovationfund.com/"}},{{"@type":"ListItem","position":2,"name":"Filers","item":"https://ioinnovationfund.com/filers/"}}]}}</script>
    <script src=\"/js/theme-init.js?v=2026060801\"></script>
    <link rel=\"stylesheet\" href=\"/css/site.css?v=2026071302\" />
    <link rel=\"stylesheet\" href=\"/css/holdings.css?v=2026081801\" />
  </head>
  <body>
    <a href=\"#main\" class=\"skip-to-main\">Skip to content</a>
    <header class=\"header\">
      <nav class=\"nav\">
        <a href=\"/\" class=\"logo\">IO Innovation Filings</a>
        <ul class=\"nav-links\" id=\"mobileNav\">
          <li><a href=\"/\">Home</a></li>
          <li><a href=\"/holdings/\">Holdings</a></li>
          <li><a href=\"/filers/\" class=\"active\">Filers</a></li>
          <li><a href=\"/blog/\">Blog</a></li>
          <li><a href=\"/about.html\">About</a></li>
          <li><a href=\"/contact.html\">Contact</a></li>
        </ul>
        <div class=\"nav-actions\">
          <button id=\"themeToggle\" class=\"theme-toggle\" aria-label=\"Toggle theme\"><i id=\"themeIcon\" class=\"theme-icon fas fa-moon\"></i></button>
          <button class=\"mobile-menu-btn\" id=\"menuBtn\" aria-label=\"Toggle menu\"><span></span><span></span><span></span></button>
        </div>
      </nav>
    </header>

    <main id=\"main\" class=\"page-shell\">
      <section class=\"hero-panel\">
        <span class=\"hero-kicker\">Coverage</span>
        <h1 class=\"hero-title\">Tracked institutions</h1>
        <p class=\"hero-subtitle\">Each page below is static HTML generated from the latest parsed 13F file.</p>
                <div class=\"inline-meta\">
                    <span>Data as of: {generated_on}</span>
                    <a href=\"/methodology.html\">Methodology</a>
                </div>
      </section>
            <section class=\"filter-panel\" aria-label=\"Filer filters\">
                <div class=\"filter-grid\">
                    <input id=\"filersSearch\" class=\"control\" type=\"search\" placeholder=\"Search by filer name\" />
                </div>
            </section>
      <section class=\"filer-grid\">
        {card_html}
      </section>
            <section class=\"hero-panel\" style=\"margin-top: 1rem\">
                <p class=\"muted\">Not investment advice. Not affiliated with the separate \"I/O Fund\" newsletter.</p>
            </section>
    </main>

    <footer class=\"footer\" role=\"contentinfo\">
      <div class=\"footer-content\">
        <div class=\"footer-bottom\"><p>&copy; {dt.datetime.now().year} IO Innovation. Educational data utility.</p></div>
      </div>
    </footer>
    <script src=\"/js/shared-simple.js?v=2026071302\"></script>
        <script>
            document.addEventListener("DOMContentLoaded", function () {{
                const input = document.getElementById("filersSearch");
                if (!input) return;
                const cards = Array.from(document.querySelectorAll(".filer-grid .filer-card"));
                input.addEventListener("input", function () {{
                    const q = input.value.trim().toLowerCase();
                    cards.forEach(function (card) {{
                        const text = card.textContent.toLowerCase();
                        card.style.display = !q || text.indexOf(q) !== -1 ? "" : "none";
                    }});
                }});
            }});
        </script>
  </body>
</html>
"""


def render_holdings_index(
    holdings_rows: list[dict[str, Any]], filers_summary: list[dict[str, Any]], generated_at: str
) -> str:
    filer_options = ['<option value="all">All filers</option>']
    for filer in filers_summary:
        filer_options.append(
            f'<option value="{html.escape(filer["slug"])}">{html.escape(filer["name"])}</option>'
        )
    filer_options.append('<option value="btc-treasury-watchlist">BTC Treasury Watchlist</option>')

    table_rows = []
    for row in holdings_rows[:300]:
        filer_slug = row.get("filer_slug", "")
        filer_name = row.get("filer_name", "")
        issuer = row.get("issuer", "")
        ticker = row.get("ticker") or "-"
        value = money(int(row.get("value_usd", 0)))
        weight = f'{float(row.get("weight_pct", 0.0)):.2f}%'
        report_period = row.get("report_period") or "-"
        btc_tag = row.get("btc_tag", False)
        btc_chip = '<span class="tag tag-btc">BTC-linked</span>' if btc_tag else "-"

        search_blob = " ".join(
            [
                filer_name,
                issuer,
                str(ticker),
                str(row.get("cusip", "")),
            ]
        ).lower()

        table_rows.append(
            "<tr "
            f'data-filer="{html.escape(filer_slug)}" '
            f'data-btc="{"yes" if btc_tag else "no"}" '
            f'data-search="{html.escape(search_blob)}">'
            f'<td><a href="/filers/{html.escape(filer_slug)}.html">{html.escape(filer_name)}</a></td>'
            f"<td>{html.escape(issuer)}</td>"
            f"<td>{html.escape(str(ticker))}</td>"
            f"<td>{value}</td>"
            f"<td>{weight}</td>"
            f"<td>{html.escape(report_period)}</td>"
            f"<td>{btc_chip}</td>"
            "</tr>"
        )

    rows_html = "\n".join(table_rows)
    options_html = "\n".join(filer_options)

    return f"""<!doctype html>
<html lang=\"en\">
    <head>
        <meta charset=\"UTF-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
        <title>Holdings Explorer | IO Innovation Filings</title>
        <meta
            name=\"description\"
            content=\"Search and filter institutional holdings by filer, ticker, and BTC-linked tag using static SEC 13F data.\"
        />
        <link rel=\"canonical\" href=\"https://ioinnovationfund.com/holdings/\" />
        <meta property=\"og:type\" content=\"website\" />
        <meta property=\"og:title\" content=\"Holdings Explorer\" />
        <meta property=\"og:description\" content=\"Institutional 13F holdings with filer and BTC-linked filters.\" />
        <meta property=\"og:url\" content=\"https://ioinnovationfund.com/holdings/\" />
        <meta property=\"og:image\" content=\"https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg\" />
        <meta property=\"og:image:alt\" content=\"IO Innovation Filings institutional holdings dashboard\" />
        <meta property=\"og:site_name\" content=\"IO Innovation Filings\" />
        <meta name=\"twitter:card\" content=\"summary_large_image\" />
        <meta name=\"twitter:image\" content=\"https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg\" />
        <meta name=\"twitter:image:alt\" content=\"IO Innovation Filings institutional holdings dashboard\" />
        <meta name=\"robots\" content=\"index, follow\" />
        <link rel=\"preconnect\" href=\"https://pagead2.googlesyndication.com\" crossorigin />
        <link rel=\"preconnect\" href=\"https://googleads.g.doubleclick.net\" crossorigin />

        <script type=\"application/ld+json\">
            {{
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "IO Innovation Filings",
                "url": "https://ioinnovationfund.com/",
                "logo": "https://ioinnovationfund.com/assets/images/og-image-1200x630.jpg"
            }}
        </script>

        <script type=\"application/ld+json\">
            {{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://ioinnovationfund.com/"}},
                    {{"@type": "ListItem", "position": 2, "name": "Holdings", "item": "https://ioinnovationfund.com/holdings/"}}
                ]
            }}
        </script>

        <script type=\"application/ld+json\">
            {{
                "@context": "https://schema.org",
                "@type": "Dataset",
                "name": "Institutional Holdings Snapshot",
                "description": "Static table of parsed 13F holdings from SEC EDGAR.",
                "url": "https://ioinnovationfund.com/holdings/",
                "license": "https://www.sec.gov/os/accessing-edgar-data",
                "datePublished": "{html.escape(generated_at)}",
                "dateModified": "{html.escape(generated_at)}"
            }}
        </script>

        <script src=\"/js/theme-init.js?v=2026060801\"></script>
        <link rel=\"stylesheet\" href=\"/css/site.css?v=2026071302\" />
        <link rel=\"stylesheet\" href=\"/css/holdings.css?v=2026081801\" />
        <link rel=\"stylesheet\" href=\"/css/ads.css?v=2026080501\" />

    </head>
    <body>
        <a href=\"#main\" class=\"skip-to-main\">Skip to content</a>

        <header class=\"header\">
            <nav class=\"nav\">
                <a href=\"/\" class=\"logo\">IO Innovation Filings</a>
                <ul class=\"nav-links\" id=\"mobileNav\">
                    <li><a href=\"/\">Home</a></li>
                    <li><a href=\"/holdings/\" class=\"active\">Holdings</a></li>
                    <li><a href=\"/filers/\">Filers</a></li>
                    <li><a href=\"/blog/\">Blog</a></li>
                    <li><a href=\"/about.html\">About</a></li>
                    <li><a href=\"/contact.html\">Contact</a></li>
                </ul>
                <div class=\"nav-actions\">
                    <button id=\"themeToggle\" class=\"theme-toggle\" aria-label=\"Toggle theme\">
                        <i id=\"themeIcon\" class=\"theme-icon fas fa-moon\"></i>
                    </button>
                    <button class=\"mobile-menu-btn\" id=\"menuBtn\" aria-label=\"Toggle menu\">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </nav>
        </header>

        <main id=\"main\" class=\"page-shell\">
            <section class=\"hero-panel\">
                <span class=\"hero-kicker\">Core Tool</span>
                <h1 class=\"hero-title\">Search institutional holdings in one table</h1>
                <p class=\"hero-subtitle\">
                    Filter by filer, ticker, and BTC-linked exposure. Data is generated server-side via GitHub Actions
                    and shipped as static files so each page has real content on first load.
                </p>
                <div class=\"inline-meta\">
                    <span>Visible rows: <strong id=\"visibleCount\">0</strong></span>
                    <span>Rows shown: {len(holdings_rows[:300])}</span>
                    <span>Data as of: {html.escape(generated_at[:10])}</span>
                    <a href=\"/data/holdings-latest.json\">Download holdings JSON</a>
                    <a href=\"/data/form4-latest.json\">Download Form 4 JSON</a>
                </div>
            </section>

            <section class=\"filter-panel\" aria-label=\"Holdings filters\">
                <div class=\"filter-grid\">
                    <input id=\"holdingsSearch\" class=\"control\" type=\"search\" placeholder=\"Search by filer, issuer, ticker, or CUSIP\" />
                    <select id=\"filerFilter\" class=\"control\">
                        {options_html}
                    </select>
                    <select id=\"btcFilter\" class=\"control\">
                        <option value=\"all\">All exposures</option>
                        <option value=\"yes\">BTC-linked only</option>
                        <option value=\"no\">Non-BTC only</option>
                    </select>
                    <button id=\"resetFilters\" class=\"btn\" type=\"button\">Reset</button>
                </div>
            </section>

            <section class=\"table-wrap\" aria-label=\"Institutional holdings table\">
                <table class=\"data-table\">
                    <thead>
                        <tr>
                            <th>Filer</th>
                            <th>Issuer</th>
                            <th>Ticker</th>
                            <th>Value (USD)</th>
                            <th>Weight</th>
                            <th>Report period</th>
                            <th>BTC tag</th>
                        </tr>
                    </thead>
                    <tbody id=\"holdingsTableBody\">
                        {rows_html}
                    </tbody>
                </table>
            </section>

            <section class=\"hero-panel\" style=\"margin-top: 1rem\">
                <h2 style=\"font-size: 1.1rem\">Form 4 feed</h2>
                <p class=\"hero-subtitle\">Recent insider filing items are published in static JSON at <a href=\"/data/form4-latest.json\">/data/form4-latest.json</a>.</p>
                <p class=\"muted\">Not investment advice. Not affiliated with the separate \"I/O Fund\" newsletter. Review <a href=\"/methodology.html\">methodology and known data limits</a>.</p>
            </section>
        </main>

        <footer class=\"footer\" role=\"contentinfo\">
            <div class=\"footer-content\">
                <div class=\"footer-bottom\">
                    <p>&copy; 2026 IO Innovation. Educational data utility, not investment advice.</p>
                </div>
            </div>
        </footer>

        <script src=\"/js/shared-simple.js?v=2026071302\"></script>
        <script src=\"/js/holdings.js?v=2026081801\"></script>
        <script src=\"/js/ads-init.js?v=2026080501\" defer></script>
    </body>
</html>
"""


def main() -> int:
    filers = json.loads((EDGAR_DIR / "filers.json").read_text(encoding="utf-8"))
    form4_issuers = json.loads((EDGAR_DIR / "form4-issuers.json").read_text(encoding="utf-8"))

    generated_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    holdings_rows: list[dict[str, Any]] = []
    filers_summary: list[dict[str, Any]] = []
    by_slug: dict[str, list[dict[str, Any]]] = {}

    for filer in filers:
        try:
            result = fetch_latest_13f(filer)
        except Exception as exc:  # noqa: BLE001
            print(f"warn: failed 13F for {filer['name']}: {exc}", file=sys.stderr)
            continue

        if not result:
            continue

        total_value = sum(item["value_usd"] for item in result.holdings)
        has_btc = any(item["btc_tag"] for item in result.holdings)

        filers_summary.append(
            {
                "slug": filer["slug"],
                "name": filer["name"],
                "cik": filer["cik"],
                "filing_date": result.filing_date,
                "report_period": result.report_period,
                "accession": result.accession,
                "filing_url": result.filing_url,
                "holdings_count": len(result.holdings),
                "total_value_usd": total_value,
                "btc_tag": has_btc,
            }
        )

        enriched = []
        for hold in result.holdings:
            row = {
                "filer_slug": filer["slug"],
                "filer_name": filer["name"],
                "filing_date": result.filing_date,
                "report_period": result.report_period,
                "accession": result.accession,
                "filing_url": result.filing_url,
                **hold,
            }
            enriched.append(row)
            holdings_rows.append(row)

        by_slug[filer["slug"]] = enriched

    filers_summary.sort(key=lambda x: x["name"])
    holdings_rows.sort(key=lambda x: x["value_usd"], reverse=True)

    form4_rows: list[dict[str, Any]] = []
    for issuer in form4_issuers:
        try:
            form4_rows.extend(fetch_recent_form4(issuer))
        except Exception as exc:  # noqa: BLE001
            print(f"warn: failed Form 4 for {issuer['name']}: {exc}", file=sys.stderr)

    form4_rows.sort(key=lambda x: x.get("filing_date", ""), reverse=True)

    btc_watchlist: list[dict[str, Any]] = []
    for issuer in form4_issuers:
        if not issuer.get("btc_treasury"):
            continue

        latest_filing = ""
        for row in form4_rows:
            if row.get("issuer_slug") == issuer["slug"]:
                latest_filing = row.get("filing_date", "")
                break

        btc_watchlist.append(
            {
                "slug": issuer["slug"],
                "name": issuer["name"],
                "cik": issuer["cik"],
                "latest_form4_filing_date": latest_filing,
            }
        )

        holdings_rows.append(
            {
                "filer_slug": "btc-treasury-watchlist",
                "filer_name": "BTC Treasury Watchlist",
                "filing_date": latest_filing,
                "report_period": latest_filing,
                "accession": "",
                "filing_url": "",
                "issuer": issuer["name"],
                "title_of_class": "Corporate Bitcoin treasury disclosure watch",
                "cusip": "",
                "ticker": "BTC",
                "value_usd": 0,
                "shares": 0,
                "put_call": "",
                "discretion": "",
                "btc_tag": True,
                "weight_pct": 0.0,
                "record_type": "btc_treasury_watchlist",
            }
        )

    holdings_rows.sort(key=lambda x: x["value_usd"], reverse=True)

    holdings_payload = {
        "generated_at": generated_at,
        "source": "SEC EDGAR submissions + filing index",
        "filers": filers_summary,
        "holdings": holdings_rows,
        "btc_treasury_watchlist": btc_watchlist,
    }
    form4_payload = {
        "generated_at": generated_at,
        "source": "SEC EDGAR submissions recent form list",
        "trades": form4_rows,
    }

    write_json(DATA_DIR / "holdings-latest.json", holdings_payload)
    write_json(DATA_DIR / "form4-latest.json", form4_payload)
    write_json(DATA_DIR / "btc-treasury-watchlist.json", {"generated_at": generated_at, "issuers": btc_watchlist})
    write_json(DATA_DIR / "filers-index.json", {"generated_at": generated_at, "filers": filers_summary})

    FILER_JSON_DIR.mkdir(parents=True, exist_ok=True)
    for summary in filers_summary:
        slug = summary["slug"]
        write_json(
            FILER_JSON_DIR / f"{slug}.json",
            {
                "generated_at": generated_at,
                "filer": summary,
                "holdings": by_slug.get(slug, []),
            },
        )

    generate_filer_pages(filers_summary, by_slug)
    (FILER_HTML_DIR / "index.html").write_text(render_filers_index(filers_summary), encoding="utf-8")
    HOLDINGS_PAGE.parent.mkdir(parents=True, exist_ok=True)
    HOLDINGS_PAGE.write_text(
        render_holdings_index(holdings_rows, filers_summary, generated_at),
        encoding="utf-8",
    )

    print(f"Generated {len(filers_summary)} filer snapshots and {len(holdings_rows)} holdings rows")
    print(f"Generated {len(form4_rows)} Form 4 entries")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
