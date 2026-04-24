# Florida + Georgia Future Student Pipeline Dashboard

Next.js + TypeScript + Tailwind starter for county-level mapping, ranking, and comparison of births/enrollment pipeline indicators.

## Included pages
- `/` Interactive map + filters + score sliders + county panel + charts + export buttons
- `/rankings` Full two-state sortable rankings table
- `/comparison` Florida vs Georgia summary comparison
- `/county/[fips]` County detail dashboard
- `/methodology` Definitions, limitations, and data notes

## Data files
- `data/fl-ga-counties-placeholder.json`: placeholder county metric records (226 rows)
- `data/fl-ga-counties.geojson`: placeholder county polygon features (226 features)
- `data/county-record.schema.json`: schema for import validation

## Swap in official data
1. Replace values in `data/fl-ga-counties-placeholder.json` with official county extracts.
2. Replace `data/fl-ga-counties.geojson` with true county boundary geometry.
3. Keep field names aligned to `data/county-record.schema.json`.
4. Re-run `npm run dev`.

## Source roadmap
- CDC / NCHS natality
- Florida Department of Health / Florida Health Charts
- Georgia Department of Public Health OASIS
- U.S. Census ACS 5-year + Population Estimates Program
- Florida DOE and Georgia DOE enrollment reports

Last updated: April 24, 2026.
