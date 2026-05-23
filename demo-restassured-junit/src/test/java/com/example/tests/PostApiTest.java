package com.example.tests;

import io.restassured.http.ContentType;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class PostApiTest extends BaseTest {

    @Test
    void getPostById() {
        given()
            .when()
                .get("/posts/1")
            .then()
                .statusCode(200)
                .body("userId", equalTo(1))
                .body("title", notNullValue())
                .body("body", notNullValue());
    }

    @Test
    @Tag("tms:2")
    void getAllPosts() {
        given()
            .when()
                .get("/posts")
            .then()
                .statusCode(200)
                .body("size()", equalTo(100));
    }

    @Test
    void getPostsByUserId() {
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
    @Tag("tms:5")
    void createPost() {
        String body = "{ \"title\": \"Test Post\", \"body\": \"This is a test post\", \"userId\": 1 }";

        given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
                .post("/posts")
            .then()
                .statusCode(201)
                .body("title", equalTo("Test Post"))
                .body("userId", equalTo(1));
    }

    @Test
    @Tag("issue:9")
    void failedAssertionDemo() {
        // Intentional failure — demonstrates how failures appear in the report
        given()
            .when()
                .get("/posts/1")
            .then()
                .statusCode(200)
                .body("title", equalTo("This title will never match"));
    }
}
