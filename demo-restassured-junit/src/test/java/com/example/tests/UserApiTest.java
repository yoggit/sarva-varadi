package com.example.tests;

import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class UserApiTest extends BaseTest {

    @Test
    void getUserById() {
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
    void getAllUsers() {
        given()
            .when()
                .get("/users")
            .then()
                .statusCode(200)
                .body("size()", greaterThan(0))
                .body("[0].id", notNullValue());
    }

    @Test
    void createUser() {
        String body = "{ \"name\": \"John Doe\", \"email\": \"john@example.com\" }";

        given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
                .post("/users")
            .then()
                .statusCode(201)
                .body("name", equalTo("John Doe"))
                .body("id", notNullValue());
    }

    @Test
    void updateUser() {
        String body = "{ \"name\": \"Jane Updated\", \"email\": \"jane.updated@example.com\" }";

        given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
                .put("/users/1")
            .then()
                .statusCode(200)
                .body("name", equalTo("Jane Updated"));
    }

    @Test
    void deleteUser() {
        given()
            .when()
                .delete("/users/1")
            .then()
                .statusCode(200);
    }

    @Test
    void getUserNotFound() {
        given()
            .when()
                .get("/users/999999")
            .then()
                .statusCode(404);
    }
}
