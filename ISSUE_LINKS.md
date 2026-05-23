# Issue & Test Management Links

Sarva-Varadi can link individual test results to external bug trackers (Jira, GitHub Issues, Linear) and test management tools (Xray, Zephyr, TestRail). When configured, clickable badges appear in the test detail drawer for each test that carries a matching tag or annotation.

---

## How it works

1. **You configure URL patterns once** in `sarva-varadi.properties` — one for bug/issue links, one for TM links.
2. **You tag individual tests** using your framework's native tagging mechanism (`@Tag`, `groups`, `@issue:`, etc.).
3. **The report renders badges** automatically — no extra tooling needed.

The `{id}` placeholder in the URL pattern is replaced with the value extracted from the tag.

---

## Step 1 — Configure URL patterns

Create or edit `sarva-varadi.properties` in your project root (or `src/test/resources/`):

```properties
# Bug / issue tracker — Jira (Xray / Zephyr live here too)
sarva.links.issue=https://your-company.atlassian.net/browse/{id}

# Test management tool
# Xray (Jira-based): same URL as issue
sarva.links.tms=https://your-company.atlassian.net/browse/{id}

# TestRail example:
# sarva.links.tms=https://your-company.testrail.io/index.php?/cases/view/{id}

# GitHub Issues example:
# sarva.links.issue=https://github.com/your-org/your-repo/issues/{id}

# Linear example:
# sarva.links.issue=https://linear.app/your-team/issue/{id}
```

> **Xray / Zephyr users**: Both tools manage test cases as Jira issues, so `sarva.links.tms` and `sarva.links.issue` point to the same Jira base URL. Use `@issue:` for bugs and `@tms:` for test cases (they are different Jira tickets with different project keys).

---

## Step 2 — Tag your tests

### Cucumber BDD

Use `@issue:` and `@tms:` as Cucumber tags on any Scenario or Feature:

```gherkin
@issue:PROJ-123 @tms:PROJ-456
Scenario: Login fails with invalid credentials
  Given a Chrome browser is launched
  When I enter wrong credentials
  Then an error message should appear
```

Multiple tags are supported:

```gherkin
@issue:PROJ-123 @issue:PROJ-124 @tms:PROJ-789
Scenario: Cart checkout with expired card
```

Tags on a Feature apply to all its Scenarios:

```gherkin
@tms:PROJ-500
Feature: Payment processing
  @issue:PROJ-101
  Scenario: Charge with valid card
  ...
  @issue:PROJ-102
  Scenario: Charge with expired card
  ...
```

---

### JUnit 5 (REST Assured / any JUnit 5 test)

Use `@Tag` with the `issue:` or `tms:` prefix:

```java
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Test
@Tag("issue:PROJ-123")
@Tag("tms:PROJ-456")
void loginWithInvalidCredentials_shouldReturnUnauthorized() {
    // ...
}
```

Multiple tags per test:

```java
@Test
@Tag("issue:PROJ-123")
@Tag("issue:PROJ-124")
@Tag("tms:PROJ-789")
void checkoutWithExpiredCard() {
    // ...
}
```

Apply to an entire class (all methods inherit the tag):

```java
@Tag("tms:PROJ-500")
class PaymentApiTest {

    @Test
    @Tag("issue:PROJ-101")
    void chargeWithValidCard() { ... }

    @Test
    @Tag("issue:PROJ-102")
    void chargeWithExpiredCard() { ... }
}
```

---

### TestNG (REST Assured / Selenium)

Use `groups` with the `issue:` or `tms:` prefix:

```java
import org.testng.annotations.Test;

@Test(groups = {"issue:PROJ-123", "tms:PROJ-456"})
public void loginWithInvalidCredentials() {
    // ...
}
```

Multiple issues on one test:

```java
@Test(groups = {"issue:PROJ-123", "issue:PROJ-124", "tms:PROJ-789"})
public void checkoutWithExpiredCard() {
    // ...
}
```

Apply to a class with TestNG's `@Test` at the class level:

```java
@Test(groups = "tms:PROJ-500")
public class PaymentApiTest {

    @Test(groups = "issue:PROJ-101")
    public void chargeWithValidCard() { ... }

    @Test(groups = "issue:PROJ-102")
    public void chargeWithExpiredCard() { ... }
}
```

---

### Playwright (TypeScript / JavaScript)

The recommended approach is **`@` tags in the test title** — no code changes inside the test body required. Playwright uses these natively for filtering too.

```typescript
test('login fails with invalid credentials @issue:PROJ-123 @tms:PROJ-456', async ({ page }) => {
  // nothing extra needed — tags are parsed from the title
});
```

Multiple tags, or just one:

```typescript
test('checkout with expired card @issue:PROJ-123 @issue:PROJ-124 @tms:PROJ-789', async ({ page }) => {
  // ...
});
```

Apply a TMS tag to an entire `describe` block via `test.use` (Playwright 1.42+):

```typescript
test.describe('Payment processing @tms:PROJ-500', () => {
  test('charge with valid card @issue:PROJ-101', async ({ page }) => { ... });
  test('charge with expired card @issue:PROJ-102', async ({ page }) => { ... });
});
```

**Alternative — programmatic annotations** (useful when the ID is dynamic or comes from a variable):

```typescript
test('login fails with invalid credentials', async ({ page }) => {
  test.info().annotations.push({ type: 'issue', description: 'PROJ-123' });
  test.info().annotations.push({ type: 'tms',   description: 'PROJ-456' });
  // ...
});
```

Both approaches can be mixed — tags from the title and programmatic annotations are merged.
```

---

## What it looks like in the report

When a test has matching tags and the URL patterns are configured, the test detail drawer shows badges at the top:

```
🐛 PROJ-123    🧪 PROJ-456
```

- **🐛 Red badge** — links to the bug/issue in your tracker
- **🧪 Indigo badge** — links to the test case in your TM tool
- Both open in a new tab
- Multiple badges render in a row

If `sarva.links.issue` or `sarva.links.tms` is not configured, tags with the matching prefix are silently ignored — no badges appear and no errors are thrown.

---

## Quick reference

| Framework | Issue tag | TMS tag |
|---|---|---|
| Cucumber | `@issue:PROJ-123` | `@tms:PROJ-456` |
| JUnit 5 | `@Tag("issue:PROJ-123")` | `@Tag("tms:PROJ-456")` |
| TestNG | `groups = {"issue:PROJ-123"}` | `groups = {"tms:PROJ-456"}` |
| Playwright | `'my test @issue:PROJ-123'` (in title) | `'my test @tms:PROJ-456'` (in title) |

---

## Xray & Zephyr — recommended project key conventions

Since Xray and Zephyr both use Jira issue keys, a common convention is to use separate Jira project keys to distinguish bug tickets from test case tickets:

| Type | Example key | Meaning |
|---|---|---|
| Bug | `BUG-123` | Defect logged in Jira |
| Test case | `QA-456` | Test case managed in Xray/Zephyr |

```properties
sarva.links.issue=https://your-company.atlassian.net/browse/{id}
sarva.links.tms=https://your-company.atlassian.net/browse/{id}
```

```gherkin
@issue:BUG-123 @tms:QA-456
Scenario: Login fails with invalid credentials
```

Both point to the same Atlassian domain — Jira resolves the correct project from the key prefix automatically.
