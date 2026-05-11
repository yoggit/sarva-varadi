package com.example.tests;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class PostApiTest {

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://jsonplaceholder.typicode.com";
        // Register filter to capture API call details
        RestAssured.filters(new RestAssuredRequestCapture());
    }

    @Test
    public void testGetPost() {
        given()
            .when()
            .get("/posts/1")
            .then()
            .statusCode(200)
            .body("userId", equalTo(1))
            .body("id", equalTo(1))
            .body("title", notNullValue())
            .body("body", notNullValue());
    }

    @Test
    public void testGetAllPosts() {
        given()
            .when()
            .get("/posts")
            .then()
            .statusCode(200)
            .body("size()", equalTo(100));
    }

    @Test
    public void testGetPostsByUserId() {
        given()
            .queryParam("userId", 1)
            .when()
            .get("/posts")
            .then()
            .statusCode(200)
            .body("size()", greaterThan(0))
            .body("[0].userId", equalTo(1));
    }

    @Test
    public void testCreatePost() {
        String requestBody = "{ \"title\": \"Test Post\", \"body\": \"This is a test post\", \"userId\": 1 }";

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/posts")
            .then()
            .statusCode(201)
            .body("title", equalTo("Test Post"))
            .body("userId", equalTo(1));
    }

    @Test
    public void testFailedPost() {
        // This test intentionally fails to demonstrate failure reporting
        given()
            .when()
            .get("/posts/1")
            .then()
            .statusCode(200)
            .body("title", equalTo("This will fail"));  // Intentional failure
    }
}
