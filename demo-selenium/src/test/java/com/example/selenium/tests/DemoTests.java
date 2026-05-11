package com.example.selenium.tests;

import io.github.yoggit.SarvaVaradiWebDriverListener;
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
import java.nio.file.Paths;

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
    public void testSuccessfulLogin() {
        driver.get("https://example.com");
        driver.findElement(By.id("username")).sendKeys("testuser");
        driver.findElement(By.id("password")).sendKeys("password123");
        driver.findElement(By.id("login-btn")).click();

        // Fail in 'half-fail' mode, occasionally in 'quarter-fail'
        if (RUN_MODE.equals("half-fail") || (RUN_MODE.equals("quarter-fail") && Math.random() < 0.3)) {
            Assert.fail("Demo failure for trend variation");
        }

        Assert.assertTrue(driver.getCurrentUrl().contains("dashboard"));
    }

    @Test(priority = 2)
    public void testLogout() {
        driver.get("https://example.com/dashboard");
        driver.findElement(By.id("logout-link")).click();

        // Pass in 'all-pass' mode, fail otherwise
        if (!RUN_MODE.equals("all-pass")) {
            Assert.fail("Logout verification failed");
        }

        Assert.assertTrue(driver.findElement(By.id("login-form")).isDisplayed());
    }

    @Test(priority = 3)
    public void testAddToCart() {
        driver.get("https://example.com/products");
        driver.findElement(By.className("add-to-cart")).click();

        // Pass in 'all-pass' and 'quarter-fail', timeout in 'half-fail'
        if (RUN_MODE.equals("half-fail")) {
            try {
                Thread.sleep(100);
                driver.findElement(By.id("element-that-never-appears"));
                Assert.fail("Element should not exist");
            } catch (Exception e) {
                throw new RuntimeException("Demo timeout failure", e);
            }
        }

        Assert.assertTrue(driver.findElement(By.className("cart-count")).isDisplayed());
    }

    @Test(priority = 4)
    public void testSearchProducts() {
        driver.get("https://example.com/products");
        driver.findElement(By.name("search")).sendKeys("laptop");
        driver.findElement(By.id("search-btn")).click();

        // Pass in 'all-pass' and 'quarter-fail', fail in 'half-fail'
        if (RUN_MODE.equals("all-pass") || RUN_MODE.equals("quarter-fail")) {
            Assert.assertTrue(true); // Pass
        } else {
            Assert.fail("Search results not found");
        }
    }

    @Test(priority = 5)
    public void testCheckoutFlow() {
        driver.get("https://example.com/checkout");
        driver.findElement(By.id("card-number")).sendKeys("4111111111111111");
        driver.findElement(By.id("confirm-order")).click();

        // Pass in 'all-pass', fail in 'half-fail', pass in 'quarter-fail'
        if (RUN_MODE.equals("all-pass") || RUN_MODE.equals("quarter-fail")) {
            Assert.assertTrue(true); // Pass
        } else {
            Assert.fail("Checkout failed");
        }
    }

    @Test(priority = 6, enabled = false)
    public void testSkippedFeature() {
        // This test is always skipped
        driver.get("https://example.com/new-feature");
        Assert.assertTrue(false, "This should be skipped");
    }

    @Test(priority = 7, invocationCount = 2, successPercentage = 50)
    public void testFlakyBehavior() {
        driver.get("https://example.com/api/status");

        // Flaky: fails randomly 50% of the time
        if (Math.random() < 0.5) {
            Assert.fail("Flaky test failed");
        }

        Assert.assertTrue(driver.getTitle().length() > 0);
    }
}
