# Troubleshooting

Solutions to the most common issues. Use the search bar or jump to a section below.

[[toc]]

---

## Report not generated

### Playwright — no `index.html` after test run

**Step 1:** Confirm the reporter is in `playwright.config.ts`:
```typescript
reporter: [
  ['list'],
  ['@sarva-varadi/playwright', { outputFolder: 'sarva-report' }]
]
```

**Step 2:** Check for errors in the test output:
```bash
npx playwright test 2>&1 | grep -i "sarva\|error"
```

**Step 3:** Verify the output folder is writable:
```bash
touch sarva-report/test.txt && rm sarva-report/test.txt
```

### Java (Selenium / RestAssured) — no `index.html`

The Java adapters write `test-results.json` first, then the Node.js CLI generates `index.html`. Both steps must succeed.

**Step 1:** Check that `test-results.json` was written:
```bash
ls -la sarva-varadi-results/test-results.json
```

**Step 2:** Run the CLI manually to see any generation errors:
```bash
npx sarva-varadi generate \
  --input sarva-varadi-results/test-results.json \
  --output sarva-report
```

**Step 3:** Verify the CLI can find `sarva-varadi.properties` — it searches in this order:
1. `./sarva-varadi.properties` (project root)
2. `src/test/resources/sarva-varadi.properties`
3. `../sarva-varadi.properties`

---

## Trends / Run History shows "No historical data"

::: warning Most common cause in CI
`index.html` embeds history at generation time. If old history isn't present **before** tests run, the report only sees 1 run — and Trends needs ≥ 2.
:::

**Fix for local development:** Run tests multiple times — history accumulates in `sarva-report/history/` between runs.

**Fix for CI (GitHub Actions):** Fetch history from the previous deployment *before* running tests:

```yaml
- name: Pre-populate history
  run: |
    git clone --depth 1 --branch gh-pages \
      https://github.com/${{ github.repository }}.git gh-pages-old || true
    if [ -d "gh-pages-old/playwright/history" ]; then
      mkdir -p sarva-report/history/
      for dir in gh-pages-old/playwright/history/*/; do
        [ -d "$dir" ] && cp -r "$dir" "sarva-report/history/$(basename $dir)" || true
      done
    fi
    rm -rf gh-pages-old

- name: Run tests   # now embeds full accumulated history
  run: npm test
```

**Also verify:** `history.enabled` is `true` in your config (it's `true` by default).

---

## Flaky tests not detected

Flaky detection requires retries to be configured — Sarva-Varadi marks a test **FLAKY** when it fails on the first attempt but passes on a retry.

**Playwright:**
```typescript
// playwright.config.ts
export default defineConfig({
  retries: 2,
  reporter: [['@sarva-varadi/playwright', {
    history: { trackPerTest: true }
  }]]
});
```

**Selenium / RestAssured TestNG:**
```java
@Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
public void myTest() { ... }
```
```properties
# sarva-varadi.properties
sarva.maxRetryCount=2
```

**RestAssured JUnit 5:**

::: warning JUnit 5 — use Surefire rerun, not `sarva.maxRetryCount`
`sarva.maxRetryCount` is for TestNG only. For JUnit 5, configure Surefire:
:::

```xml
<!-- pom.xml -->
<plugin>
  <artifactId>maven-surefire-plugin</artifactId>
  <configuration>
    <rerunFailingTestsCount>1</rerunFailingTestsCount>
  </configuration>
</plugin>
```

---

## Screenshots / videos not showing

**Playwright — enable capture in config:**
```typescript
use: {
  screenshot: 'only-on-failure',  // or 'always'
  video: 'retain-on-failure',     // or 'on'
  trace: 'on-first-retry',
}
```

**Selenium — enable in properties:**
```properties
sarva.screenshot=on-failure    # always | on-failure | never
sarva.screenshotDir=sarva-varadi-results/screenshots
```

**Videos not playing in browser?** Check codec support — Sarva-Varadi embeds WebM. Open the browser console:
```javascript
const v = document.createElement('video');
console.log(v.canPlayType('video/webm')); // should be 'probably'
```

---

## Notifications not firing

### Java adapters (Selenium / RestAssured)
Notifications for Java tools are configured in `sarva-varadi.properties`, not in a TypeScript config.

```properties
sarva.notification.enabled=true
sarva.notification.slack.enabled=true
sarva.notification.slack.webhook-url=${SLACK_WEBHOOK_URL}
```

The `${ENV_VAR}` syntax is expanded at runtime. If the env var is missing the notification is silently skipped.

### Test your Slack webhook directly
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"test"}' YOUR_WEBHOOK_URL
# Should return: ok
```

### Email login failures (Gmail)
```
Error: 535-5.7.8 Username and Password not accepted
```
You need an **App Password**, not your Google account password:
1. Enable 2FA at [myaccount.google.com](https://myaccount.google.com/signinoptions/two-step-verification)
2. Generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the 16-character password as `EMAIL_PASS`

### Teams notifications not appearing
Test the webhook directly:
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"@type":"MessageCard","summary":"Test","title":"Test","text":"test"}' \
  YOUR_TEAMS_WEBHOOK_URL
```
Also verify the connector is still active: Teams channel → **...** → Connectors → check Incoming Webhook is configured.

---

## CI/CD — history not accumulating across runs

**Most common cause:** the gh-pages deploy action doesn't preserve existing files.

```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./gh-pages-deploy
    keep_files: true   # ← required to preserve history/ folders
```

Without `keep_files: true` every deploy wipes the history.

---

## Installation issues

### `npm install` fails — dependency conflict
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### `Cannot find module '@sarva-varadi/core'`
```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/playwright
npm list @sarva-varadi/core   # verify it's installed
```

### JitPack download fails (JUnit 5 / Selenium)
```
Could not resolve: com.github.yoggit.sarva-varadi:...:v2.1.1
```
1. Verify the `jitpack.io` repository is declared in `pom.xml` (must be before Maven Central)
2. Force re-download: `mvn dependency:resolve -U`
3. Check build status: [jitpack.io/#yoggit/sarva-varadi/v2.1.1](https://jitpack.io/#yoggit/sarva-varadi/v2.1.1) — green checkmark = artifacts available

---

## JUnit 5 specific issues

### HTTP request/response missing from report steps

**Root cause:** Another JUnit 5 extension called `RestAssured.replaceFiltersWith()` in its `@BeforeEach`, wiping the capture filter.

**Fix:** Ensure you are on **v2.1.1+**. The extension uses `BeforeTestExecutionCallback` (fires *after* all `@BeforeEach` and `BeforeEachCallback`), guaranteeing the filter is always registered at test execution time.

### Extension not picking up all test classes

```java
// Option 1: annotate each class
@ExtendWith(SarvaVaradiJUnit5Extension.class)
public class MyTest { ... }

// Option 2: shared base class
@ExtendWith(SarvaVaradiJUnit5Extension.class)
public abstract class BaseTest { }
public class MyTest extends BaseTest { ... }

// Option 3: auto-detect via service loader
// In pom.xml Surefire config:
// <configurationParameters>
//   junit.jupiter.extensions.autodetection.enabled=true
// </configurationParameters>
// Create: src/test/resources/META-INF/services/org.junit.jupiter.api.extension.Extension
// containing: io.github.yoggit.sarvavaradi.SarvaVaradiJUnit5Extension
```

### `test-results.json` not written after `mvn test`

The extension uses a JVM shutdown hook to write results. If Surefire kills the JVM forcefully the hook may not run. Add explicit report generation as a Maven exec step:

```xml
<plugin>
  <groupId>org.codehaus.mojo</groupId>
  <artifactId>exec-maven-plugin</artifactId>
  <executions>
    <execution>
      <id>sarva-generate</id>
      <phase>test</phase>
      <goals><goal>exec</goal></goals>
      <configuration>
        <executable>npx</executable>
        <arguments>
          <argument>sarva-varadi</argument>
          <argument>generate</argument>
          <argument>--input</argument>
          <argument>sarva-varadi-results/test-results.json</argument>
          <argument>--output</argument>
          <argument>sarva-report</argument>
        </arguments>
      </configuration>
    </execution>
  </executions>
</plugin>
```

---

## Performance

### Report generation is slow

```typescript
// Reduce history depth while iterating
history: { maxRuns: 10, trackPerTest: false }

// Disable attachments and trends in local dev
embedAttachments: process.env.CI === 'true',
trends: { enabled: process.env.CI === 'true' },
```

### Large test suite (1000+ tests) — Node.js runs out of memory

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

---

## Browser compatibility

Sarva-Varadi requires a modern browser:

| Browser | Minimum version |
|---------|----------------|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

Internet Explorer is not supported. Safari 13 and below are not supported (lack optional chaining).

---

## Still stuck?

Before opening an issue, include:

- **OS**, **Node.js version**, **`@sarva-varadi/core` version**, **framework** (Playwright / Selenium / RestAssured + TestNG or JUnit 5)
- **Steps to reproduce**
- **Expected vs actual behaviour**
- Contents of `sarva-varadi-results/test-results.json` (redact any sensitive data)
- Console output / error stack trace

→ [Open an issue on GitHub](https://github.com/yoggit/sarva-varadi/issues/new)
