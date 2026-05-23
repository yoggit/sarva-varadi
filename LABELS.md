# Severity & Labels

Sarva-Varadi supports labelling individual tests with **severity**, **owner**, **feature**, and any custom labels. These appear as coloured badges in the test list and the test detail drawer, making it easy to understand the risk impact of failures at a glance.

---

## Severity

Severity describes **how bad it is if this test fails** — independent of whether it is currently passing or failing.

| Severity | Badge colour | Meaning | Example tests |
|---|---|---|---|
| `critical` | 🔴 Red | Core business flow — failure means the system is effectively broken | Login, checkout, payment |
| `high` | 🟠 Orange | Important feature — failure has major UX or business impact | Search, user profile, API auth |
| `medium` | 🟡 Amber | Standard feature — failure is noticeable but a workaround exists | Filters, sorting, CSV export |
| `low` | 🔵 Blue | Minor feature — failure is an edge case or cosmetic issue | Tooltip text, footer link |
| `trivial` | ⚫ Gray | Nice-to-have — failure has almost no user impact | Dark mode toggle, animation |

**Why this matters:** When a run has 8 failures, severity tells you immediately which ones are release blockers and which can be logged as tickets and shipped around. A `critical` failure stops the release; a `trivial` failure does not.

---

## Other supported labels

| Label | Purpose | Example value |
|---|---|---|
| `owner` | Team or person responsible for this test | `payments-team`, `alice` |
| `feature` | Feature area or module the test covers | `checkout`, `auth`, `users-api` |
| `epic` | Epic or initiative the test relates to | `EPIC-42` |
| `story` | User story the test relates to | `STORY-99` |

These appear as neutral chips in the test detail drawer below the issue/TMS link badges.

---

## How to set labels

### Cucumber BDD

Use Cucumber tags with the `severity:`, `owner:`, or `feature:` prefix:

```gherkin
@severity:critical @owner:payments-team @feature:checkout
Scenario: Checkout fails with expired card
  Given a user has items in their cart
  When they attempt to pay with an expired card
  Then an error message should appear
```

Tags on a Feature apply to all its Scenarios:

```gherkin
@severity:high @feature:auth
Feature: User authentication

  @severity:critical
  Scenario: Login with valid credentials
    ...

  Scenario: Login with invalid credentials
    ...
```

---

### JUnit 5 (REST Assured / any JUnit 5 test)

Use `@Tag` with the `severity:`, `owner:`, or `feature:` prefix:

```java
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Test
@Tag("severity:critical")
@Tag("owner:payments-team")
@Tag("feature:checkout")
void checkoutWithExpiredCard_shouldReturnError() {
    // ...
}
```

Apply to an entire class so all methods in the class inherit the label:

```java
@Tag("severity:high")
@Tag("feature:auth")
class AuthApiTest {

    @Test
    @Tag("severity:critical")
    void loginWithValidCredentials() { ... }

    @Test
    void loginWithInvalidCredentials() { ... }
}
```

---

### TestNG (REST Assured / Selenium)

Use `groups` with the `severity:`, `owner:`, or `feature:` prefix:

```java
import org.testng.annotations.Test;

@Test(groups = {"severity:critical", "owner:payments-team", "feature:checkout"})
public void checkoutWithExpiredCard() {
    // ...
}
```

Apply to a class with TestNG's `@Test` at the class level:

```java
@Test(groups = {"severity:high", "feature:auth"})
public class AuthApiTest {

    @Test(groups = "severity:critical")
    public void loginWithValidCredentials() { ... }

    @Test
    public void loginWithInvalidCredentials() { ... }
}
```

---

### Playwright (TypeScript / JavaScript)

The recommended approach is **`@` tags in the test title**:

```typescript
test('checkout fails with expired card @severity:critical @owner:payments-team', async ({ page }) => {
  // nothing extra needed inside the test body
});
```

Apply a severity to an entire `describe` block:

```typescript
test.describe('Checkout flow @severity:high @feature:checkout', () => {
  test('valid card @severity:critical', async ({ page }) => { ... });
  test('expired card', async ({ page }) => { ... });
});
```

**Alternative — programmatic annotations** (useful when the value is dynamic):

```typescript
test('checkout fails with expired card', async ({ page }) => {
  test.info().annotations.push({ type: 'severity', description: 'critical' });
  test.info().annotations.push({ type: 'owner',    description: 'payments-team' });
  // ...
});
```

Both approaches can be mixed — title tags and programmatic annotations are merged.

---

## What it looks like in the report

**Test list** — a small coloured badge appears inline after the test name:

```
checkout fails with expired card   [critical]   playwright   ✗ failed   2.3s   ...
```

**Test detail drawer subtitle** — severity badge appears next to the status pill:

```
Latest Run · 22 May 2026, 14:30   ✗ failed   [critical]   2.3s
```

**Test detail drawer body** — owner, feature, and other labels appear as neutral chips below the issue/TMS link badges:

```
🐛 PROJ-123   🧪 QA-456

owner: payments-team   feature: checkout
```

---

## Quick reference

| Framework | Severity | Owner | Feature |
|---|---|---|---|
| Cucumber | `@severity:critical` | `@owner:qa-team` | `@feature:checkout` |
| JUnit 5 | `@Tag("severity:critical")` | `@Tag("owner:qa-team")` | `@Tag("feature:checkout")` |
| TestNG | `groups = {"severity:critical"}` | `groups = {"owner:qa-team"}` | `groups = {"feature:checkout"}` |
| Playwright | `'my test @severity:critical'` (in title) | `'my test @owner:qa-team'` (in title) | `'my test @feature:checkout'` (in title) |

---

## Combining with issue & TMS links

Labels work alongside issue/TMS links — a test can carry all of them at once:

**Cucumber:**
```gherkin
@severity:critical @issue:BUG-123 @tms:QA-456 @owner:payments-team
Scenario: Checkout fails with expired card
```

**JUnit 5:**
```java
@Test
@Tag("severity:critical")
@Tag("issue:BUG-123")
@Tag("tms:QA-456")
@Tag("owner:payments-team")
void checkoutWithExpiredCard() { ... }
```

**Playwright:**
```typescript
test('checkout fails with expired card @severity:critical @issue:BUG-123 @tms:QA-456', async ({ page }) => {
  // ...
});
```

📖 **[Issue & TMS link setup guide → ISSUE_LINKS.md](ISSUE_LINKS.md)**
