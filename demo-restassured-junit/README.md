# Sarva-Varadi RestAssured JUnit 5 Demo

Demo project showing how to integrate RestAssured API tests (JUnit 5) with Sarva-Varadi reporting framework. HTTP request/response steps are captured **automatically** — no filter registration needed.

## Prerequisites

- Java 11 or higher
- Maven 3.6+
- Node.js 18+ (for report generation)

## Project Structure

```
demo-restassured-junit/
├── pom.xml                           # Maven configuration (JitPack dependency + exec plugin)
├── src/
│   └── test/
│       └── java/
│           └── com/example/tests/
│               ├── BaseTest.java                # @ExtendWith(SarvaVaradiJUnit5Extension.class)
│               ├── UserApiTest.java             # User API tests
│               ├── PostApiTest.java             # Post API tests
│               └── FlakyApiTest.java            # Flaky test demo
└── sarva-varadi-results/             # Test results (generated)
    └── test-results.json
```

> HTTP request/response steps are captured automatically via `SarvaVaradiJUnit5Extension` — no `RestAssuredRequestCapture` filter wiring needed.

## Quick Start

### 1. Run Tests

```bash
mvn clean test
```

### 2. View Report

```bash
open sarva-report/index.html   # macOS
start sarva-report/index.html  # Windows
xdg-open sarva-report/index.html  # Linux
```

## Test API

This demo uses **JSONPlaceholder** (https://jsonplaceholder.typicode.com), a free fake REST API for testing:

- `/users` - User management endpoints
- `/posts` - Blog post endpoints

## Tests Included

### UserApiTest.java
- ✅ `getUser_returnsValidData()` - Fetch single user
- ✅ `getAllUsers_returnsList()` - Fetch all users
- ✅ `createUser_returnsCreated()` - Create new user
- ✅ `updateUser_returnsUpdated()` - Update existing user
- ✅ `deleteUser_returnsOk()` - Delete user
- ✅ `invalidUserId_returns404()` - Test 404 handling

### PostApiTest.java
- ✅ `getPost_returnsValidData()` - Fetch single post
- ✅ `getAllPosts_returnsList()` - Fetch all posts
- ✅ `getPostsByUserId_returnsFiltered()` - Filter posts by user
- ✅ `createPost_returnsCreated()` - Create new post
- ❌ `failedPost_intentional()` - Intentional failure (for demo)

### FlakyApiTest.java
- ⚠️ `flakyEndpoint_failsThenPasses()` - Simulates flaky test (fails first, passes on retry)
- ✅ `stableEndpoint_alwaysPasses()` - Normal stable test for comparison

## How It Works

The `BaseTest` class applies `@ExtendWith(SarvaVaradiJUnit5Extension.class)`:

```java
@ExtendWith(SarvaVaradiJUnit5Extension.class)
public abstract class BaseTest { }
```

All test classes that extend `BaseTest` automatically get:
- HTTP request/response capture via `RestAssuredRequestCapture`
- Test result capture (pass/fail/skip/flaky)
- Duration and error details

The extension registers the filter using `BeforeTestExecutionCallback`, which fires **after** all `@BeforeEach` methods — no manual wiring needed.

## Security: Sensitive Data Masking

```bash
# Enable masking when running tests
mvn test -Dsarva.maskSensitiveData=true
```

**What gets masked:** Headers: Authorization, API keys, Cookies. Body fields: password, token, secret, credit_card, ssn.

## Report Features

The generated Sarva-Varadi report (`sarva-report/index.html`) is a single-page app with four sidebar tabs:

- **Overview** — Pass/fail/flaky summary, run metadata
- **Tests** — Detailed API call steps with request/response data, search and filter
- **Trends** — Historical trends across multiple runs, flaky test leaderboard
- **Timeline** — Gantt chart of when each test ran

Additional features:
- 📱 Dark/Light theme support
- 📤 PDF print, PNG download, CSV export
- 🔒 Optional sensitive data masking
- ⚠️ Automatic flaky test detection via Surefire `rerunFailingTestsCount`

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run API Tests
  run: cd demo-restassured-junit && mvn clean test

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: junit5-api-test-report
    path: demo-restassured-junit/sarva-report/
```

## Troubleshooting

### Maven Build Fails

```bash
mvn clean install -U
```

### Report Not Generated

Ensure test results exist:
```bash
ls sarva-varadi-results/test-results.json
```

## License

MIT
