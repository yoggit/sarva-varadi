package com.example.selenium.tests;

import io.github.yoggit.sarvavaradi.SarvaVaradiWebDriverListener;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.events.EventFiringDecorator;
import org.testng.Assert;
import org.testng.annotations.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

public class DemoTests {
    private WebDriver driver;
    private SarvaVaradiWebDriverListener listener;

    // Counter to cycle through pass rates: 100%, 50%, 75%
    private static String getRunMode() {
        File counterFile = new File(".run-counter-selenium");
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

    @BeforeMethod
    public void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");

        WebDriver originalDriver = new ChromeDriver(options);
        listener = new SarvaVaradiWebDriverListener(originalDriver);
        EventFiringDecorator<WebDriver> decorator = new EventFiringDecorator<>(listener);
        driver = decorator.decorate(originalDriver);
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test(priority = 1)
    public void testHomepageLoads() {
        driver.get("https://www.selenium.dev/");

        // Fail in 'half-fail' mode, occasionally in 'quarter-fail'
        if (RUN_MODE.equals("half-fail") || (RUN_MODE.equals("quarter-fail") && Math.random() < 0.3)) {
            Assert.fail("Demo failure for trend variation");
        }

        Assert.assertTrue(driver.getTitle().contains("Selenium"), "Page title should contain Selenium");
    }

    @Test(priority = 2)
    public void testDocumentationPageLoads() {
        driver.get("https://www.selenium.dev/documentation/");

        // Pass in 'all-pass' mode, fail otherwise
        if (!RUN_MODE.equals("all-pass")) {
            Assert.fail("Documentation page verification failed");
        }

        Assert.assertTrue(driver.findElement(By.tagName("h1")).isDisplayed(),
                "Documentation heading should be visible");
    }

    @Test(priority = 3)
    public void testDownloadsPageLoads() {
        driver.get("https://www.selenium.dev/downloads/");

        // Pass in 'all-pass' and 'quarter-fail', fail in 'half-fail'
        if (RUN_MODE.equals("half-fail")) {
            Assert.fail("Downloads page failed to load expected content");
        }

        Assert.assertTrue(driver.getTitle().length() > 0, "Downloads page should have a title");
    }

    @Test(priority = 4)
    public void testWebDriverDocsContent() {
        driver.get("https://www.selenium.dev/documentation/webdriver/");

        // Pass in 'all-pass' and 'quarter-fail', fail in 'half-fail'
        if (RUN_MODE.equals("all-pass") || RUN_MODE.equals("quarter-fail")) {
            Assert.assertTrue(driver.findElement(By.tagName("h1")).isDisplayed(),
                    "WebDriver docs heading should be visible");
        } else {
            Assert.fail("WebDriver docs content not found");
        }
    }

    @Test(priority = 5)
    public void testEcosystemPageLoads() {
        driver.get("https://www.selenium.dev/ecosystem/");

        // Pass in 'all-pass', fail in 'half-fail', pass in 'quarter-fail'
        if (RUN_MODE.equals("all-pass") || RUN_MODE.equals("quarter-fail")) {
            Assert.assertTrue(driver.getTitle().length() > 0, "Ecosystem page should have a title");
        } else {
            Assert.fail("Ecosystem page failed to load");
        }
    }

    @Test(priority = 6, enabled = false)
    public void testBlogPagePagination() {
        // This test is always skipped
        driver.get("https://www.selenium.dev/blog/");
        Assert.assertTrue(false, "This should be skipped");
    }

    @Test(priority = 7, invocationCount = 2, successPercentage = 50)
    public void testFlakyPageTitle() {
        driver.get("https://www.selenium.dev/");

        // Flaky: fails randomly 50% of the time
        if (Math.random() < 0.5) {
            Assert.fail("Flaky test failed");
        }

        Assert.assertTrue(driver.getTitle().length() > 0, "Page title should not be empty");
    }
}
