# @sarva-varadi/rest-assured-junit

RestAssured (JUnit 5) adapter for Sarva-Varadi — automatically captures HTTP request/response details as test steps with zero extra wiring, and generates beautiful, interactive reports with historical trend tracking.

> For the TestNG variant see [@sarva-varadi/rest-assured](../rest-assured/README.md).

---

## Installation

**Step 1 — npm package** (report generator):

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/rest-assured-junit
```

**Step 2 — Maven dependency** (Java extension, via JitPack):

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
        <artifactId>sarva-varadi-restassured-junit</artifactId>
        <version>v2.1.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## Quick Setup

### 1 — Add `@ExtendWith` to your base test class

```java
import io.github.yoggit.sarvavaradi.SarvaVaradiJUnit5Extension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(SarvaVaradiJUnit5Extension.class)
public abstract class BaseTest { }
```

All test classes that extend `BaseTest` are automatically covered — no filter registration needed.

### 2 — Write tests as normal

```java
import org.junit.jupiter.api.Test;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

class UserApiTest extends BaseTest {

    @Test
    void getUser_returnsValidData() {
        given()
            .baseUri("https://api.example.com")
        .when()
            .get("/users/1")
        .then()
            .statusCode(200)
            .body("name", notNullValue());
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
| HTTP method, URL, status code | ✅ Automatic — no filter wiring needed |
| Request & response headers | ✅ Automatic |
| Request & response body | ✅ Automatic |
| Flaky / retry detection | ✅ Via Surefire `rerunFailingTestsCount` |
| Screenshots | N/A — API tests have no browser UI |

> The extension registers `RestAssuredRequestCapture` using `BeforeTestExecutionCallback`, which fires **after** all `@BeforeEach` methods — ensuring the filter is always in place even when other JUnit 5 extensions are present.

---

## Flaky Test Detection

Configure retries in your `pom.xml` Surefire plugin:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <rerunFailingTestsCount>1</rerunFailingTestsCount>
    </configuration>
</plugin>
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

For the complete step-by-step guide including the Maven exec plugin for report generation, see the [RestAssured (JUnit 5) + Maven Integration Guide](../../README.md#restassured-junit-maven-guide) in the main README.

---

## License

MIT
