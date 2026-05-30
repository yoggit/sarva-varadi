# New & Absent Tests

The Overview tab surfaces two coverage signals after each run: **New Tests** and **Absent Tests**. Understanding what they mean — and why a test might appear in either list — helps you act on the right signal and ignore the noise.

[[toc]]

---

## What is a "New" test?

A test is flagged as **New** when it appears in the current run but has **never been seen before** in any previous run.

### Possible reasons

| Reason | Description |
|--------|-------------|
| ✅ Genuinely new | A developer added a new test case to the suite |
| ⚠️ Renamed | An existing test was renamed — the old name disappears (absent), the new name appears (new) |
| ⚠️ Moved to a different file | The test moved files — its `fullName` changes, so it looks new |

### What the report shows

```
NEW TESTS  1 test
┌────────────────────────────────────────────────────────────────┐
│ ✓  Login with SSO                             [Chromium]       │
│    First time in this run — new test, or renamed / moved       │
│    from an existing one                                         │
└────────────────────────────────────────────────────────────────┘
```

### What to do

1. **Confirm it's intentional** — check your recent git changes
2. **If it's a rename** — the old name will appear in Absent Tests; both will naturally age out within 3 runs
3. **If it's genuinely new** — no action needed; history starts accumulating from this run

---

## What is an "Absent" test?

A test is flagged as **Absent** when it ran in one or more previous runs but is **missing from the current run**.

### Possible reasons

| Reason | Description |
|--------|-------------|
| ✅ Genuinely deleted | A developer intentionally removed the test |
| ⚠️ Renamed | The test was renamed — old name shows as absent, new name shows as new |
| ⚠️ Moved to a different file | The test moved files — its `fullName` changed, old entry shows as absent |
| ⚠️ Skipped / filtered | The test was excluded by a tag filter or marked `skip` for this run |

### What the report shows

```
ABSENT TESTS  1 test
┌────────────────────────────────────────────────────────────────┐
│ ✓  Login with password                        [Firefox]        │
│    Not seen in 2 consecutive runs · Last seen: May 28, 02:01   │
│    May be deleted, renamed, or moved — verify recent changes   │
└────────────────────────────────────────────────────────────────┘
```

### What to do

1. **Check recent changes** — was the test deleted, renamed, or moved?
2. **If intentionally deleted** — it will age out automatically after 3 consecutive absent runs
3. **If it's a skip** — check for `test.skip` or tag filters in your test config
4. **If it's a rename** — the new name appears in New Tests; both lists self-clear within 3 runs

---

## The 3-run aging rule

Sarva-Varadi cannot automatically distinguish between a deleted test, a renamed test, or a moved test — they all look the same: the `testId` (based on test name + file path) is no longer present in the run.

To avoid permanent noise in the Absent section, absent tests are **aged out** after **3 consecutive runs** without appearing.

### Lifecycle example

```
Run 20:  "Login Test"  ✓ PASSED   → normal test, in history
Run 21:  "Login Test"  absent     → shown in Absent (not seen in 1 run)
Run 22:  "Login Test"  absent     → shown in Absent (not seen in 2 runs)
Run 23:  "Login Test"  absent     → shown in Absent (not seen in 3 runs)
Run 24:  "Login Test"  absent     → AGED OUT — no longer shown in Absent section
Run 25+: still absent             → remains aged out (silent)
```

### What "aged out" means

Aged out = **removed from the Absent display only**. The underlying history data in `runs.json` is fully preserved.

If the test comes back under the same name, its complete history is automatically restored on the very next run:

```
Run 30:  "Login Test"  ✓ PASSED   → back in Tests list with full history from runs 1–20 intact ✅
```

---

## Scenario walkthroughs

### Scenario 1 — Test genuinely deleted

```
Run 10:  "Checkout test"  ✓ PASSED
Run 11:  Test deleted from codebase
Run 11:  "Checkout test"  ABSENT  (1 run) → shown with hint
Run 12:  "Checkout test"  ABSENT  (2 runs) → shown with hint
Run 13:  "Checkout test"  ABSENT  (3 runs) → shown with hint
Run 14:  AGED OUT → no longer shown
```

**Action:** No action needed. Aged out cleanly after 3 runs.

---

### Scenario 2 — Test renamed

```
Run 10:  "Login with password"  ✓ PASSED
Run 11:  Developer renames to "Login with credentials"

Run 11:  NEW    "Login with credentials"  ← new name, first appearance
         ABSENT "Login with password"     ← old name, not seen (1 run)

Run 12:  "Login with credentials"  runs normally (no longer "new")
         ABSENT "Login with password" — not seen (2 runs)

Run 13:  ABSENT "Login with password" — not seen (3 runs)

Run 14:  "Login with password" AGED OUT — no longer shown
         "Login with credentials" builds its own history from run 11 onwards
```

**Action:** Verify the rename was intentional. Both signals resolve automatically.

---

### Scenario 3 — Test temporarily skipped

```
Run 15:  "Payment test"  skipped (marked test.skip in code)
Run 15:  "Payment test" → ABSENT (it didn't execute)

Run 16:  Developer removes test.skip
Run 16:  "Payment test"  ✓ PASSED → back in Tests list, absent count resets
```

**Action:** Check for `test.skip` or filter flags. Once the test runs again, it leaves the absent list immediately.

---

### Scenario 4 — Deleted test restored

```
Run 20:  "Search test"  ✓ PASSED
Runs 21–23: Test deleted → aged out of Absent after run 23
Run 30:  Developer restores the test with same name
Run 30:  "Search test"  ✓ PASSED → back in Tests list
         Full history from runs 1–20 automatically restored ✅
```

**Action:** No action needed. History is never deleted, only the Absent display entry ages out.

---

## Key points to remember

- Both **New** and **Absent** signals can indicate a rename or file move — they appear as a pair (one absent, one new) in the same run
- Sarva-Varadi tracks by **test name + file path** — there is no automatic rename detection
- The **3-run aging** window gives you time to investigate before the signal disappears
- **History data is always preserved** — aging out only affects the Absent display, not the underlying data
- If a test is skipped (not just absent), it won't appear in the absent list — only tests that truly don't execute show as absent
