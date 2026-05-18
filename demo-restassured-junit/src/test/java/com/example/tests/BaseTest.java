package com.example.tests;

import io.github.yoggit.sarvavaradi.SarvaVaradiJUnit5Extension;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.extension.ExtendWith;

/**
 * Base class for all API tests.
 *
 * @ExtendWith wires Sarva-Varadi into the JUnit 5 lifecycle for every subclass.
 * The RestAssured capture filter is registered automatically by the extension —
 * no extra setup is needed beyond extending this class.
 */
@ExtendWith(SarvaVaradiJUnit5Extension.class)
public class BaseTest {

    @BeforeAll
    static void configureSuite() {
        RestAssured.baseURI = "https://jsonplaceholder.typicode.com";
    }
}
