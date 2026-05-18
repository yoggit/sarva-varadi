# @sarva-varadi/rest-assured

RestAssured (TestNG) adapter for Sarva-Varadi — captures HTTP request/response details as test steps and generates beautiful, interactive reports with historical trend tracking.

> For the JUnit 5 variant see [@sarva-varadi/rest-assured-junit](../rest-assured-junit/README.md).

---

## Installation

**Step 1 — npm package** (report generator):

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/rest-assured
```

**Step 2 — Maven dependency** (Java listener, via JitPack):

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>com.github.yoggit.sarva-varadi</groupId>
        <artifactId>sarva-varadi-restassured</artifactId>
        <version>v2.1.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## Quick Setup

### 1 — Add listener to `testng.xml`

```xml
<suite name="API Test Suite">
    <listeners>
        <listener class-name="io.github.yoggit.sarvavaradi.SarvaVaradiListener"/>
    </listeners>
    <test name="API Tests">
        <classes>
            <class name="com.example.tests.UserApiTest"/>
        </classes>
    </test>
</suite>
```

### 2 — Register the request capture filter

```java
import io.github.yoggit.sarvavaradi.RestAssuredRequestCapture;
import io.restassured.RestAssured;
import org.testng.annotations.BeforeClass;

public class BaseTest {

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://api.example.com";
        RestAssured.filters(new RestAssuredRequestCapture());
    }
}
```

### 3 — Run tests

```bash
mvn clean test
```

Report is generated at `sarva-report/index.html`.

---

## What Gets Captured

| Data | Captured |
|---|---|
| Test pass / fail / skip | ✅ Automatic |
| Duration | ✅ Automatic |
| Error message & stack trace | ✅ Automatic |
| HTTP method, URL, status code | ✅ Via `RestAssuredRequestCapture` filter |
| Request & response headers | ✅ Via filter |
| Request & response body | ✅ Via filter |
| Flaky / retry detection | ✅ Via `SarvaVaradiRetryAnalyzer` |
| Screenshots | N/A — API tests have no browser UI |

---

## Flaky Test Detection

```java
@Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
public void testFlakyEndpoint() {
    given().when().get("/users/status").then().statusCode(200);
}
```

Configure retry count in `sarva-varadi.properties`:

```properties
sarva.maxRetryCount=2
```

Tests that pass after a retry are automatically marked **FLAKY** in the report.

---

## Sensitive Data Masking

```properties
# sarva-varadi.properties
sarva.maskSensitiveData=true
```

When enabled, fields matching `password`, `token`, `secret`, `apikey`, `authorization`, `cookie` are replaced with `***` in request/response bodies and headers.

---

## Notifications

Send Slack, Teams, or Email notifications after each run via `sarva-varadi.properties`:

```properties
sarva.notifications.enabled=true
sarva.notifications.slack.enabled=true
sarva.notifications.slack.webhookUrl=${SLACK_WEBHOOK_URL}
sarva.notifications.slack.channel=#test-results
```

See [NOTIFICATIONS.md](../../NOTIFICATIONS.md) for full configuration options.

---

## Full Integration Guide

For the complete step-by-step guide including the Maven exec plugin for report generation, see the [RestAssured (TestNG) + Maven Integration Guide](../../README.md#restassured-maven-guide) in the main README.

---

## License

MIT
