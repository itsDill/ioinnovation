# Manual 13F data entry

The comparison dashboard reads manually curated data from `filings.json` and the legacy baseline snapshot in `../holdings-latest.json`. No network collector runs now. Add each filing as one object in the `filings` array, preserving every reported position and the exact SEC filing link.

## Filing object

Each filing must include:

- `filer`: `slug`, `name`, and zero-padded SEC `cik`
- `report_period`: quarter-end date (`YYYY-MM-DD`)
- `filing_date`: date filed with the SEC (`YYYY-MM-DD`)
- `accession`: SEC accession number, including dashes
- `filing_url`: direct SEC filing URL
- `amended`: `true` only for a 13F amendment
- `holdings`: array of reported positions

Each holding uses `issuer`, `title_of_class`, `cusip`, `ticker`, `value_usd`, `shares`, `put_call`, `discretion`, and `btc_tag`. Use an empty string for unavailable text values, `0` only when the filing reports zero, and `false` when a BTC tag does not apply. SEC information-table `value` fields are reported in thousands of dollars; convert to dollars by multiplying by 1,000. Do not infer undisclosed positions.

Example shape (replace all values with verified data):

```json
{
  "filer": {
    "slug": "manager-slug",
    "name": "Manager name as filed",
    "cik": "0000000000"
  },
  "report_period": "YYYY-MM-DD",
  "filing_date": "YYYY-MM-DD",
  "accession": "0000000000-00-000000",
  "filing_url": "https://www.sec.gov/Archives/edgar/data/...",
  "amended": false,
  "holdings": [
    {
      "issuer": "ISSUER NAME",
      "title_of_class": "COM",
      "cusip": "000000000",
      "ticker": "",
      "value_usd": 0,
      "shares": 0,
      "put_call": "",
      "discretion": "DFND",
      "btc_tag": false
    }
  ]
}
```

Keep each accession as a distinct filing; amendments should not overwrite original submissions. The dashboard uses the most recently filed snapshot for that reporting period as the default, while still letting visitors select a specific filing. After editing, validate the JSON and verify the SEC filing link before publishing.
