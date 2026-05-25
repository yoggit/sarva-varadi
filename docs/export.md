# PDF & Export

Sarva-Varadi has three built-in export formats. No extra tooling needed — everything is in the report itself.

[[toc]]

---

## PDF Print

Click the **Print** button (top-right toolbar) to generate a structured PDF.

**What you get:**
- A4 landscape orientation
- Page 1: Table of contents with clickable section links
- One page per section: Overview → Failures → Tests → Trends → Timeline → Run History
- Each section has a coloured header (`OVERVIEW`, `FAILURES`, etc.) printed at the top of the page
- Page numbers in the footer
- Only print-relevant content shown — filters, banners, buttons are hidden
- Charts rendered as they appear in the browser at print time

::: tip Viewing a historical run before printing
If you click **View →** in Run History before printing, the PDF will include a note in the TOC showing which historical run was active (e.g. `⏪ Viewing Run #3 · Apr 30, 2026 · 72.7% pass rate`). All charts in the PDF reflect that historical run's data.
:::

**Browser tip:** Use Chrome or Edge for the best PDF output. In the print dialog, set destination to "Save as PDF" and enable "Background graphics".

---

## PNG Chart Download

Every chart has a **download** button (↓ icon) in the card header.

Clicking it saves a PNG of that chart with the Sarva-Varadi logo watermark in the corner.

Charts available for download:

| Tab | Charts |
|-----|--------|
| Overview | Health Pulse |
| Trends | Pass Rate Trend · Failures & Flakiness · Failures by Severity · Test Count · Run Duration · Top Failing · Top Flaky |
| Timeline | Run Cadence · Execution Gantt |

---

## CSV Export

| Location | What it exports |
|----------|----------------|
| Tests tab toolbar | All visible tests (name, status, duration, suite, severity, browser) |
| Overview → Top Failing | Failing tests with failure count |
| Overview → Top Flaky | Flaky tests with flaky score |

The CSV opens directly in Excel / Google Sheets and includes column headers.
