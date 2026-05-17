package com.example.tests;

import io.github.yoggit.sarvavaradi.RestAssuredRequestCapture;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class UserApiTest {

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://jsonplaceholder.typicode.com";
        // Register filter to capture API call details
        RestAssured.filters(new RestAssuredRequestCapture());
    }

    @Test
    public void testGetUser() {
        given()
            .when()
            .get("/users/1")
            .then()
            .statusCode(200)
            .body("id", equalTo(1))
            .body("name", notNullValue())
            .body("email", containsString("@"));
    }

    @Test
    public void testGetAllUsers() {
        given()
            .when()
            .get("/users")
            .then()
            .statusCode(200)
            .body("size()", greaterThan(0))
            .body("[0].id", notNullValue());
    }

    @Test
    public void testCreateUser() {
        String requestBody = "{ \"name\": \"John Doe\", \"email\": \"john@example.com\" }";

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/users")
            .then()
            .statusCode(201)
            .body("name", equalTo("John Doe"))
            .body("id", notNullValue());
    }

    @Test
    public void testUpdateUser() {
        String requestBody = "{ \"name\": \"Jane Updated\", \"email\": \"jane.updated@example.com\" }";

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .put("/users/1")
            .then()
            .statusCode(200)
            .body("name", equalTo("Jane Updated"));
    }

    @Test
    public void testDeleteUser() {
        given()
            .when()
            .delete("/users/1")
            .then()
            .statusCode(200);
    }

    @Test
    public void testInvalidUserId() {
        given()
            .when()
            .get("/users/999999")
            .then()
            .statusCode(404);
    }
}
