# IO Innovation Filings Scripts

## SEC EDGAR Refresh

The site is intentionally static. Data is generated offline by GitHub Actions and committed as JSON/HTML artifacts.

### Main script

- `fetch_edgar_data.py`: pulls SEC EDGAR submissions for curated 13F filers and curated Form 4 issuer list, then writes:
  - `data/holdings-latest.json`
  - `data/form4-latest.json`
  - `data/filers-index.json`
  - `data/filers/*.json`
  - `filers/*.html`
  - `filers/index.html`

### Local run

```bash
python -m pip install requests
python scripts/fetch_edgar_data.py
```

### Automation

- Workflow: `.github/workflows/update-edgar-data.yml`
- Schedule: daily cron + manual trigger
