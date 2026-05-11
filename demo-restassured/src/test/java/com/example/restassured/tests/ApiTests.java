package com.example.restassured.tests;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class ApiTests {

    // Counter to cycle through pass rates: 100%, 50%, 75%
    private static String getRunMode() {
        File counterFile = new File(".run-counter-restassured");
        int counter = 0;

        if (counterFile.exists()) {
            try {
                String content = new String(Files.readAllBytes(counterFile.toPath()));
                counter = Integer.parseInt(content.trim());
            } catch (Exception e) {
                counter = 0;
            }
        }

        counter = (counter + 1) % 3;

        try {
            Files.write(counterFile.toPath(), String.valueOf(counter).getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }

        if (counter == 0) return "all-pass";
        if (counter == 1) return "half-fail";
        return "quarter-fail";
    }

    private static final String RUN_MODE = getRunMode();

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://jsonplaceholder.typicode.com";
    }

    @Test(priority = 1)
    public void testGetUser() {
        Response response = given()
            .when()
            .get("/users/1")
            .then()
            .statusCode(200)
            .body("name", notNullValue())
            .extract().response();

        // Fail in 'half-fail' mode, occasionally in 'quarter-fail'
        if (RUN_MODE.equals("half-fail") || (RUN_MODE.equals("quarter-fail") && Math.random() < 0.3)) {
            Assert.fail("Demo failure for trend variation");
        }

        Assert.assertTrue(response.getStatusCode() == 200);
    }

    @Test(priority = 2)
    public void testCreateUser() {
        String requestBody = "{ \"name\": \"John Doe\", \"username\": \"johndoe\", \"email\": \"john@example.com\" }";

        Response response = given()
            .header("Content-Type", "application/json")
            .body(requestBody)
            .when()
            .post("/users")
            .then()
            .extract().response();

        // Pass in 'all-pass' mode, fail otherwise
        if (!RUN_MODE.equals("all-pass")) {
            Assert.fail("User creation failed");
        }

        Assert.assertTrue(response.getStatusCode() == 201);
    }

    @Test(priority = 3)
    public void testUpdateUser() {
        String requestBody = "{ \"name\": \"Jane Doe Updated\", \"username\": \"janedoe\" }";

        Response response = given()
            .header("Content-Type", "application/json")
            .body(requestBody)
            .when()
            .put("/users/1")
            .then()
            .extract().response();

        // Pass in 'all-pass' and 'quarter-fail', fail in 'half-fail'
        if (RUN_MODE.equals("half-fail")) {
            Assert.fail("Update failed");
        }

        Assert.assertTrue(response.getStatusCode() == 200);
    }

    @Test(priority = 4)
    public void testDeleteUser() {
        Response response = given()
            .when()
            .delete("/users/1")
            .then()
            .extract().response();

        // Pass in 'all-pass' and 'quarter-fail', fail in 'half-fail'
        if (RUN_MODE.equals("all-pass") || RUN_MODE.equals("quarter-fail")) {
            Assert.assertTrue(true); // Pass
        } else {
            Assert.fail("Delete operation failed");
        }
    }

    @Test(priority = 5)
    public void testGetPosts() {
        Response response = given()
            .queryParam("userId", 1)
            .when()
            .get("/posts")
            .then()
            .statusCode(200)
            .body("size()", greaterThan(0))
            .extract().response();

        // Pass in 'all-pass', fail in 'half-fail', pass in 'quarter-fail'
        if (RUN_MODE.equals("all-pass") || RUN_MODE.equals("quarter-fail")) {
            Assert.assertTrue(true); // Pass
        } else {
            Assert.fail("Posts retrieval failed");
        }
    }

    @Test(priority = 6, enabled = false)
    public void testSkippedEndpoint() {
        // This test is always skipped
        given()
            .when()
            .get("/skipped-endpoint")
            .then()
            .statusCode(200);

        Assert.fail("This should be skipped");
    }

    @Test(priority = 7, invocationCount = 2, successPercentage = 50)
    public void testFlakyEndpoint() {
        // Flaky: fails randomly 50% of the time
        if (Math.random() < 0.5) {
            Assert.fail("Flaky API test failed");
        }

        given()
            .when()
            .get("/users/2")
            .then()
            .statusCode(200);
    }
}
