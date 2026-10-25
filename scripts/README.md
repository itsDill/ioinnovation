# Data maintenance

The website is static. Add verified 13F snapshots to `data/manual/filings.json`, validate the JSON, then commit the data file. The dashboard combines these records with `data/holdings-latest.json` as a temporary baseline; manually entered accessions take precedence when they overlap.

See `data/manual/README.md` for the filing schema, source-link requirements, amendment handling, and manual publishing checklist. No scheduled collector or network-fetch script is used.
