package com.example.tests;

import io.restassured.RestAssured;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

/**
 * Demonstrates flaky test detection in API testing
 */
public class FlakyApiTest {

    private static int attemptCount = 0;

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://jsonplaceholder.typicode.com";
        RestAssured.filters(new RestAssuredRequestCapture());
    }

    /**
     * Simulates a flaky test that fails on first attempt but passes on retry
     * This mimics real scenarios like:
     * - Network timeouts
     * - Race conditions
     * - Database locks
     * - Service temporarily unavailable
     */
    @Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
    public void testFlakyEndpoint() {
        attemptCount++;

        given()
            .when()
            .get("/users/1")
            .then()
            .statusCode(200)
            .body("name", notNullValue());

        // Simulate flakiness: fail on first attempt, pass on retry
        if (attemptCount == 1) {
            throw new RuntimeException("Simulated network timeout - test will retry");
        }
    }

    /**
     * Normal stable test for comparison
     */
    @Test
    public void testStableEndpoint() {
        given()
            .when()
            .get("/users/2")
            .then()
            .statusCode(200)
            .body("email", notNullValue());
    }
}
