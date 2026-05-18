package com.example.tests;

import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

/**
 * Demonstrates flaky test detection.
 *
 * The flaky test fails on first attempt and passes on retry.
 * Surefire's rerunFailingTestsCount=1 (in pom.xml) triggers the retry.
 * The Sarva-Varadi extension detects the retry pattern and marks it FLAKY.
 */
public class FlakyApiTest extends BaseTest {

    private static int flakyAttemptCount = 0;

    @Test
    void flakyEndpointTest() {
        flakyAttemptCount++;

        given()
            .when()
                .get("/users/1")
            .then()
                .statusCode(200)
                .body("name", notNullValue());

        // Simulate flakiness: fail on first attempt, pass on retry
        // Mimics real scenarios: network timeouts, race conditions, cache misses
        if (flakyAttemptCount == 1) {
            throw new RuntimeException("Simulated intermittent failure — test will be retried");
        }
    }

    @Test
    void stableEndpointTest() {
        // Stable test alongside the flaky one, for comparison in the report
        given()
            .when()
                .get("/users/2")
            .then()
                .statusCode(200)
                .body("email", notNullValue());
    }
}
