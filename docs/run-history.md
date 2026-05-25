# Run History

The **Run History** tab lists every historical run that Sarva-Varadi has recorded. It is the sixth sidebar tab and the heart of the cross-run analysis feature.

[[toc]]

---

## What it shows

Each row in the table represents one past run and shows:

| Column | Description |
|--------|-------------|
| Run # | Sequential run number (most recent = highest) |
| Date / Time | When the run executed |
| Status | Passed / Failed / Flaky based on outcome distribution |
| Pass Rate | % of tests that passed |
| Total | Total test count |
| Duration | How long the run took |
| View → | Button to load that run into the report |

---

## Filters

The filter bar at the top of the tab lets you narrow down runs before browsing. Each filter can be cleared individually (✕) or all at once (Clear All).

| Filter | Options |
|--------|---------|
| Date range | Calendar date pickers — defaults to last 30 days on load |
| Status | All / Passed / Failed / Flaky |
| Pass rate | Min % threshold (e.g. "show only runs ≥ 80%") |
| Duration | Max seconds (e.g. "show only runs under 300s") |

::: tip Default date range
On first load the date filter defaults to **last 30 days** to avoid rendering hundreds of rows. Clear the date filter (✕) or widen the range to see older runs.
:::

**Clear All** resets every filter but restores the 30-day date default rather than showing all runs.

---

## Viewing a historical run

Click **View →** on any row. The report instantly hot-swaps to that run:

- **Overview** re-renders with that run's stat cards, health pulse, and top lists
- **Failures** shows that run's failures
- **Tests** shows that run's test results
- **Trends** and **Timeline** remain on the latest data but place a dashed vertical marker at the selected run's position
- A **viewing banner** appears at the top of every tab: `Viewing Run #N · date · pass rate · duration`

### Back to Latest

The viewing banner includes a **← Back to Latest** link. Click it (or click any nav tab) to restore the current run.

---

## Chart auto-centering

Charts with a run-count filter (Overview Health Pulse, Trends, Timeline Run Cadence) have a **Last 10 / 20 / 50 / All** filter. When you click **View →** on a run that falls outside the current window, the chart automatically centers a 20-run window on the selected run.

The chart header label changes to reflect this:

```
Runs #51–70 · centered on Run #61
```

Clicking any filter button (Last 10, Last 20, etc.) exits centered mode and returns to the normal window.

---

## Coverage Changes while viewing history

The **New Tests** and **Absent Tests** widgets on Overview are always relative to the **current/latest** run — not the historical run being viewed. They are hidden automatically when a historical run is active, because test-history is not replayed to a point-in-time. A tooltip on each widget notes this behaviour.

---

## History storage

History is stored as individual JSON files in `sarva-report/history/` — one folder per run. The `runs.json` index is rebuilt by the CLI from those folders each time a report is generated. There is no database; the folder can be committed to git, zipped, or copied as-is.

In CI, use the pattern of fetching the existing `history/` folder from your previous deployment before running tests, so history accumulates across CI runs.

→ See [Architecture](./architecture) for the full history model.
