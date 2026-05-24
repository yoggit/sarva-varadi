# Sarva-Varadi RestAssured-Cucumber BDD Demo

Demo project showing how to integrate RestAssured API tests written in Cucumber BDD style with Sarva-Varadi reporting. Feature → Scenario → Step hierarchy is captured automatically, with each BDD step enriched by the underlying HTTP request/response details.

## Prerequisites

- Java 11 or higher
- Maven 3.6+
- Node.js 18+ (for report generation)

## Project Structure

```
demo-restassured-cucumber/
├── cucumber-source/
│   └── data.json                             # Base scenarios for demo history generation
└── sarva-report/                             # Generated report
    └── index.html
```

## Features Under Test

This demo tests a REST API using Cucumber BDD + RestAssured across two feature files:

### User Management API (5 scenarios)
- ✅ Retrieve all users from the API
- ✅ Retrieve a specific user by ID
- ✅ Create a new user successfully
- ✅ Update user details with valid data
- ✅ Validate schema of user creation response

### Posts API (3 scenarios)
- ✅ Retrieve all posts from the API
- ✅ Create a new post and verify location header
- ✅ Get comments for a specific post

## Step Hierarchy

Each BDD scenario captures two levels:

- **Level 1** — BDD step: `When I send a GET request to "/users"`
- **Level 2** — HTTP sub-step: `HTTP GET /users — 200 OK (840ms)`

## How It Works

The Sarva-Varadi Cucumber plugin (`SarvaVaradiCucumberPlugin`) records the BDD scenario tree. When `sarva-varadi-rest-assured` is also on the classpath, each `When` step is automatically enriched with the captured HTTP request and response.

### Plugin registration (`junit-platform.properties`)

```properties
cucumber.plugin=io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin
cucumber.glue=com.example.cucumber
cucumber.features=src/test/resources/features
```

### Step definitions

```java
@Given("the REST API base URL is {string}")
public void setBaseUrl(String url) {
    RestAssured.baseURI = url;
}

@When("I send a GET request to {string}")
public void sendGet(String path) {
    response = RestAssured.get(path);
}

@Then("the response status code should be {int}")
public void verifyStatus(int code) {
    response.then().statusCode(code);
}
```

## Report Features

The generated report (`sarva-report/index.html`) includes:

- **Overview** — Pass/fail/flaky summary, health pulse, top failures, run history
- **Tests** — BDD steps with collapsible HTTP sub-steps, request/response capture, search and filter by tag
- **Trends** — Historical pass rate and flakiness trends across 25 demo runs
- **Timeline** — Gantt chart of scenario execution order

## Configuration (`sarva-varadi.properties`)

```properties
sarva.report.frameworkLabel=RestAssured-Cucumber BDD
sarva.links.issue=https://github.com/yoggit/sarva-varadi/issues/{id}
sarva.links.tms=https://github.com/yoggit/sarva-varadi/issues/{id}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run RestAssured Cucumber Tests
  run: cd demo-restassured-cucumber && mvn clean test

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: restassured-cucumber-report
    path: demo-restassured-cucumber/sarva-report/
```

## License

MIT
