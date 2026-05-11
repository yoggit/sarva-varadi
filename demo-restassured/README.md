# Sarva-Varadi RestAssured Demo

Demo project showing how to integrate RestAssured API tests with Sarva-Varadi reporting framework.

## Prerequisites

- Java 11 or higher
- Maven 3.6+
- Node.js 18+ (for report generation)

## Project Structure

```
demo-restassured/
├── pom.xml                           # Maven configuration
├── package.json                      # npm scripts for reporting
├── src/
│   └── test/
│       ├── java/
│       │   ├── SarvaVaradiListener.java          # TestNG listener
│       │   └── com/example/tests/
│       │       ├── UserApiTest.java              # User API tests
│       │       └── PostApiTest.java              # Post API tests
│       └── resources/
│           └── testng.xml                        # TestNG configuration
└── sarva-varadi-results/             # Test results (generated)
    └── test-results.json
```

## Quick Start

### 1. Install Dependencies

```bash
# Install Maven dependencies
mvn clean install

# Install npm dependencies (for report generation)
npm install
```

### 2. Run Tests

```bash
# Option 1: Run tests only
npm test

# Option 2: Run tests and generate report
npm run test:report
```

### 3. View Report

```bash
# Open the generated report
open sarva-report/index.html
```

## Test API

This demo uses **JSONPlaceholder** (https://jsonplaceholder.typicode.com), a free fake REST API for testing:

- `/users` - User management endpoints
- `/posts` - Blog post endpoints
- `/comments` - Comment endpoints

## Tests Included

### UserApiTest.java
- ✅ `testGetUser()` - Fetch single user
- ✅ `testGetAllUsers()` - Fetch all users
- ✅ `testCreateUser()` - Create new user
- ✅ `testUpdateUser()` - Update existing user
- ✅ `testDeleteUser()` - Delete user
- ✅ `testInvalidUserId()` - Test 404 handling

### PostApiTest.java
- ✅ `testGetPost()` - Fetch single post
- ✅ `testGetAllPosts()` - Fetch all posts
- ✅ `testGetPostsByUserId()` - Filter posts by user
- ✅ `testCreatePost()` - Create new post
- ❌ `testFailedPost()` - Intentional failure (for demo)

### FlakyApiTest.java
- ⚠️ `testFlakyEndpoint()` - Simulates flaky test (fails first, passes on retry)
- ✅ `testStableEndpoint()` - Normal stable test for comparison

## Security: Sensitive Data Masking

**By default, request/response data is NOT masked** - you see exactly what your tests capture.

### Enable Masking (Optional)

To automatically mask sensitive data like passwords and tokens:

```bash
# Enable masking when running tests
mvn test -Dsarva.maskSensitiveData=true

# Or add to npm script
"test:secure": "mvn test -Dsarva.maskSensitiveData=true"
```

**What gets masked:**
- Headers: Authorization, API keys, Cookies
- Body fields: password, token, secret, credit_card, ssn

**Example:**
```json
// Default (no masking):
{"user": "john", "password": "secret123"}

// With masking enabled:
{"user": "john", "password": "***MASKED***"}
```

**Best Practice:** Use fake test data (no masking needed) rather than real credentials.

## Customization

### Add More Tests

Create new test classes in `src/test/java/com/example/tests/`:

```java
package com.example.tests;

import io.restassured.RestAssured;
import org.testng.annotations.Test;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class MyApiTest {
    @Test
    public void testMyEndpoint() {
        given()
            .baseUri("https://api.example.com")
            .when()
            .get("/endpoint")
            .then()
            .statusCode(200);
    }
}
```

### Update testng.xml

Add your new test class:

```xml
<class name="com.example.tests.MyApiTest"/>
```

## Report Features

The generated Sarva-Varadi report includes:

- 📊 Test execution summary with pass/fail/flaky breakdown
- 📈 Historical trends (with multiple runs)
- 🔍 Detailed API call steps with request/response data
- ⚠️ Automatic flaky test detection with retry tracking
- 📱 Dark/Light theme support
- 🔎 Search and filter capabilities
- 🔒 Optional sensitive data masking

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run API Tests
  run: cd demo-restassured && mvn test

- name: Generate Report
  if: always()
  run: cd demo-restassured && npx sarva-varadi generate --input sarva-varadi-results/test-results.json --output sarva-report

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: api-test-report
    path: demo-restassured/sarva-report/
```

## Troubleshooting

### Maven Build Fails

```bash
# Clear Maven cache and rebuild
mvn clean install -U
```

### Tests Not Running

Check that testng.xml is in the correct location:
```
src/test/resources/testng.xml
```

### Report Generation Fails

Ensure test results exist:
```bash
ls sarva-varadi-results/test-results.json
```

## License

MIT
