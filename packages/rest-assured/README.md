# @sarva-varadi/rest-assured

RestAssured adapter for Sarva-Varadi test reporting framework. Seamlessly integrate your RestAssured API tests with comprehensive test reporting and analytics.

## Installation

```bash
npm install @sarva-varadi/rest-assured @sarva-varadi/core
```

## Quick Start

### Option 1: Using TestNG Listener (Recommended)

1. **Copy the TestNG listener to your Java project**

Create `src/test/java/SarvaVaradiListener.java` with the listener code (see below).

2. **Add listener to testng.xml**

```xml
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="API Test Suite">
    <listeners>
        <listener class-name="SarvaVaradiListener"/>
    </listeners>
    <test name="API Tests">
        <classes>
            <class name="com.example.tests.UserApiTest"/>
            <class name="com.example.tests.ProductApiTest"/>
        </classes>
    </test>
</suite>
```

3. **Run your tests**

```bash
mvn test
```

4. **Generate Sarva-Varadi report**

```bash
npx sarva-varadi generate --input sarva-varadi-results/test-results.json --output sarva-report
```

### Option 2: Using Universal Converter

If you already have TestNG XML results:

```bash
# Run RestAssured tests with TestNG
mvn test

# Convert TestNG results to Sarva-Varadi report
npx sarva-varadi convert target/surefire-reports/testng-results.xml
```

## TestNG Listener Code

Save this as `SarvaVaradiListener.java` in your Java test project:

```java
import org.testng.*;
import com.google.gson.Gson;
import java.io.*;
import java.util.*;

public class SarvaVaradiListener implements ITestListener {
    private List<Map<String, Object>> results = new ArrayList<>();
    private Gson gson = new Gson();

    @Override
    public void onTestSuccess(ITestResult result) {
        captureResult(result, "PASS");
    }

    @Override
    public void onTestFailure(ITestResult result) {
        captureResult(result, "FAIL");
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        captureResult(result, "SKIP");
    }

    private void captureResult(ITestResult result, String status) {
        Map<String, Object> testData = new HashMap<>();
        testData.put("testName", result.getTestClass().getName() + "." + result.getMethod().getMethodName());
        testData.put("methodName", result.getMethod().getMethodName());
        testData.put("status", status);
        testData.put("startTime", result.getStartMillis());
        testData.put("endTime", result.getEndMillis());

        if (result.getThrowable() != null) {
            Map<String, String> error = new HashMap<>();
            error.put("message", result.getThrowable().getMessage());
            error.put("stackTrace", getStackTrace(result.getThrowable()));
            testData.put("error", error);
        }

        results.add(testData);
    }

    @Override
    public void onFinish(ITestContext context) {
        try {
            File outputDir = new File("sarva-varadi-results");
            outputDir.mkdirs();

            File outputFile = new File(outputDir, "test-results.json");
            FileWriter writer = new FileWriter(outputFile);
            writer.write(gson.toJson(results));
            writer.close();

            System.out.println("✅ Sarva-Varadi results: " + outputFile.getAbsolutePath());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String getStackTrace(Throwable throwable) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        throwable.printStackTrace(pw);
        return sw.toString();
    }
}
```

**Add Gson dependency to pom.xml:**

```xml
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
    <scope>test</scope>
</dependency>
```

## Example RestAssured Test

```java
import io.restassured.RestAssured;
import org.testng.annotations.Test;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class UserApiTest {
    
    @Test
    public void testGetUser() {
        given()
            .baseUri("https://jsonplaceholder.typicode.com")
            .when()
            .get("/users/1")
            .then()
            .statusCode(200)
            .body("name", notNullValue())
            .body("email", containsString("@"));
    }

    @Test
    public void testCreateUser() {
        given()
            .baseUri("https://jsonplaceholder.typicode.com")
            .header("Content-Type", "application/json")
            .body("{ \"name\": \"John Doe\", \"email\": \"john@example.com\" }")
            .when()
            .post("/users")
            .then()
            .statusCode(201)
            .body("name", equalTo("John Doe"));
    }
}
```

## Configuration

Add to your `package.json`:

```json
{
  "scripts": {
    "test": "mvn test",
    "report": "npx sarva-varadi generate --input sarva-varadi-results/test-results.json --output sarva-varadi-report"
  }
}
```

## Security: Sensitive Data Masking

**By default, all request/response data is passed through as-is** (no masking). This gives you full visibility into your API tests.

### Enable Sensitive Data Masking (Optional)

If your tests use real credentials or sensitive data, you can enable automatic masking by setting a system property:

**Maven:**
```bash
mvn test -Dsarva.maskSensitiveData=true
```

**Command Line:**
```bash
java -Dsarva.maskSensitiveData=true -jar your-tests.jar
```

**What gets masked when enabled:**
- **Headers**: Authorization, X-API-Key, X-Auth-Token, Cookie, Set-Cookie
- **Body Fields**: password, token, apikey, secret, credit_card, ssn, etc.

**Example:**
```json
// Without masking (default):
{"username": "john", "password": "secret123"}

// With masking enabled:
{"username": "john", "password": "***MASKED***"}
```

### Best Practices

1. **Use test data**: Use fake/test credentials in your tests (no masking needed)
2. **Separate environments**: Don't run tests against production with real data
3. **Enable masking**: Only enable masking if you must test with sensitive data
4. **Review reports**: Reports are typically internal - ensure proper access control

## Features

- ✅ Full TestNG lifecycle support
- ✅ Captures test failures with stack traces
- ✅ Supports data-driven tests (TestNG parameters)
- ✅ REST API specific metadata with request/response details
- ✅ Historical trend analysis
- ✅ Automatic flaky test detection with retry tracking
- ✅ Sensitive data masking (opt-in)

## Flaky Test Detection

API tests can be flaky due to network issues, timeouts, race conditions, or infrastructure instability. Sarva-Varadi automatically detects and tracks flaky tests.

### Enable Retry for Flaky Tests

Add the retry analyzer to your test:

```java
@Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
public void testApiEndpoint() {
    given()
        .when()
        .get("/users/1")
        .then()
        .statusCode(200);
}
```

### How It Works

1. **Test fails** on first attempt (network timeout, race condition, etc.)
2. **Retry analyzer** automatically retries up to 2 times
3. **Test passes** on retry → marked as **FLAKY** ⚠️
4. **Report shows** flaky tests separately with retry count

### Configure Retry Count

Edit `SarvaVaradiRetryAnalyzer.java`:

```java
private static final int MAX_RETRY_COUNT = 2; // Change to your preference
```

### Common Flaky Scenarios in API Testing

- Network timeouts or intermittent connectivity
- Database locks or connection pool exhaustion
- Race conditions in async operations
- Third-party API dependencies being unstable
- Time-dependent test logic

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run API Tests
  run: mvn test

- name: Generate Sarva-Varadi Report
  if: always()
  run: npx sarva-varadi generate --input sarva-varadi-results/test-results.json --output sarva-varadi-report

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: api-test-report
    path: sarva-varadi-report/
```

## License

MIT
