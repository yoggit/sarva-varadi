package com.example.cucumber;

import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.*;
import org.junit.jupiter.api.Assertions;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

public class StepDefinitions {

    private WebDriver driver;

    @Before
    public void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        driver = new ChromeDriver(options);
    }

    @After
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Given("a Chrome browser is launched")
    public void aChromeBrowserIsLaunched() {
        Assertions.assertNotNull(driver, "Browser should be initialized");
    }

    @When("I navigate to {string}")
    public void iNavigateTo(String url) {
        driver.get(url);
    }

    @Then("the page title should contain {string}")
    public void thePageTitleShouldContain(String expected) {
        String title = driver.getTitle();
        Assertions.assertTrue(title.contains(expected),
            "Expected title to contain '" + expected + "' but was: " + title);
    }

    @Then("the page title should not be empty")
    public void thePageTitleShouldNotBeEmpty() {
        Assertions.assertFalse(driver.getTitle().isEmpty(), "Page title should not be empty");
    }

    @Then("the navigation bar should be present")
    public void theNavigationBarShouldBePresent() {
        boolean hasNav    = !driver.findElements(By.tagName("nav")).isEmpty();
        boolean hasHeader = !driver.findElements(By.tagName("header")).isEmpty();
        Assertions.assertTrue(hasNav || hasHeader, "Navigation bar should be present");
    }

    @Then("the main heading should be visible")
    public void theMainHeadingShouldBeVisible() {
        Assertions.assertFalse(driver.findElements(By.tagName("h1")).isEmpty(),
            "Main heading (h1) should be present");
        Assertions.assertTrue(driver.findElement(By.tagName("h1")).isDisplayed(),
            "Main heading should be visible");
    }

    @Then("the page has content")
    public void thePageHasContent() {
        boolean hasMain     = !driver.findElements(By.tagName("main")).isEmpty();
        boolean hasArticle  = !driver.findElements(By.tagName("article")).isEmpty();
        boolean hasSection  = !driver.findElements(By.tagName("section")).isEmpty();
        Assertions.assertTrue(hasMain || hasArticle || hasSection,
            "Page should have content (main/article/section element)");
    }
}
