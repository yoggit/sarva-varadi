package io.github.yoggit.sarvavaradi;

import org.openqa.selenium.*;
import org.openqa.selenium.support.events.WebDriverListener;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

/**
 * WebDriver Event Listener for Sarva-Varadi
 * Captures WebDriver actions, screenshots, and browser logs
 */
public class SarvaVaradiWebDriverListener implements WebDriverListener {

    private final String screenshotDir;
    private final boolean maskSensitive;
    private final String screenshotMode;

    private final List<Map<String, Object>> actions = Collections.synchronizedList(new ArrayList<>());
    private final WebDriver driver;
    private int screenshotCounter = 0;
    private String currentTestName = null;

    public SarvaVaradiWebDriverListener(WebDriver driver) {
        this.driver = driver;
        this.screenshotDir = SarvaVaradiConfig.getScreenshotDir();
        this.maskSensitive = SarvaVaradiConfig.isMaskSensitiveData();
        this.screenshotMode = SarvaVaradiConfig.getScreenshotMode();
        createScreenshotDirectory();
    }

    private void createScreenshotDirectory() {
        try {
            Files.createDirectories(Paths.get(screenshotDir));
        } catch (IOException e) {
            System.err.println("Failed to create screenshot directory: " + e.getMessage());
        }
    }

    @Override
    public void beforeGet(WebDriver driver, String url) {
        recordAction("navigate", "GET " + url, null);
    }

    @Override
    public void afterGet(WebDriver driver, String url) {
        recordAction("navigate", "Navigated to " + url, "success");
    }

    @Override
    public void beforeClick(WebElement element) {
        String elementInfo = getElementInfo(element);
        recordAction("click", "Click on " + elementInfo, null);
    }

    @Override
    public void afterClick(WebElement element) {
        recordAction("click", "Clicked successfully", "success");
    }

    @Override
    public void beforeSendKeys(WebElement element, CharSequence... keysToSend) {
        String elementInfo = getElementInfo(element);
        String value = Arrays.toString(keysToSend);

        // Mask sensitive data if enabled
        if (maskSensitive && isSensitiveField(element)) {
            value = "***MASKED***";
        }

        recordAction("sendKeys", "Type into " + elementInfo + ": " + value, null);
    }

    @Override
    public void afterSendKeys(WebElement element, CharSequence... keysToSend) {
        recordAction("sendKeys", "Typed successfully", "success");
    }

    @Override
    public void beforeFindElement(WebDriver driver, By locator) {
        recordAction("findElement", "Find element: " + locator.toString(), null);
    }

    @Override
    public void afterFindElement(WebDriver driver, By locator, WebElement result) {
        recordAction("findElement", "Element found", "success");
    }

    @Override
    public void onError(Object target, Method method, Object[] args, InvocationTargetException e) {
        recordAction("error", "Error: " + e.getCause().getMessage(), "failed");
        captureScreenshot("error");
    }

    private void recordAction(String type, String description, String status) {
        Map<String, Object> action = new HashMap<>();
        action.put("type", type);
        action.put("description", description);
        action.put("timestamp", System.currentTimeMillis());
        if (status != null) {
            action.put("status", status);
        }

        actions.add(action);
    }

    private String getElementInfo(WebElement element) {
        try {
            String tagName = element.getTagName();
            String id = element.getAttribute("id");
            String name = element.getAttribute("name");
            String className = element.getAttribute("class");

            StringBuilder info = new StringBuilder(tagName);
            if (id != null && !id.isEmpty()) {
                info.append("#").append(id);
            } else if (name != null && !name.isEmpty()) {
                info.append("[name=").append(name).append("]");
            } else if (className != null && !className.isEmpty()) {
                info.append(".").append(className.split(" ")[0]);
            }

            return info.toString();
        } catch (Exception e) {
            return "element";
        }
    }

    private boolean isSensitiveField(WebElement element) {
        try {
            String type = element.getAttribute("type");
            String name = element.getAttribute("name");
            String id = element.getAttribute("id");

            if ("password".equalsIgnoreCase(type)) {
                return true;
            }

            String[] sensitiveKeywords = {"password", "pwd", "secret", "token", "apikey", "api_key", "auth"};
            for (String keyword : sensitiveKeywords) {
                if ((name != null && name.toLowerCase().contains(keyword)) ||
                    (id != null && id.toLowerCase().contains(keyword))) {
                    return true;
                }
            }
        } catch (Exception e) {
            // Ignore
        }

        return false;
    }

    private void captureScreenshot(String prefix) {
        try {
            if (driver instanceof TakesScreenshot) {
                TakesScreenshot screenshotDriver = (TakesScreenshot) driver;
                File screenshot = screenshotDriver.getScreenshotAs(OutputType.FILE);

                String filename = prefix + "-" + (++screenshotCounter) + "-" +
                                System.currentTimeMillis() + ".png";
                File destination = new File(screenshotDir, filename);

                Files.copy(screenshot.toPath(), destination.toPath());

                // Record screenshot in actions
                Map<String, Object> screenshotAction = new HashMap<>();
                screenshotAction.put("type", "screenshot");
                screenshotAction.put("description", "Screenshot captured: " + filename);
                screenshotAction.put("file", filename);
                screenshotAction.put("timestamp", System.currentTimeMillis());
                actions.add(screenshotAction);
            }
        } catch (Exception e) {
            System.err.println("Failed to capture screenshot: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getActions() {
        return new ArrayList<>(actions);
    }

    public void clearActions() {
        actions.clear();
    }

    /**
     * Capture screenshot at test end based on configured mode
     * Modes: always, on-failure, never
     */
    public void captureTestEndScreenshot(String testName, String testStatus) {
        this.currentTestName = testName;

        boolean shouldCapture = false;

        switch (screenshotMode.toLowerCase()) {
            case "always":
                // Always capture end screenshot for all tests
                shouldCapture = true;
                break;
            case "on-failure":
                // Only capture on failure/broken
                shouldCapture = "failed".equalsIgnoreCase(testStatus) ||
                               "broken".equalsIgnoreCase(testStatus);
                break;
            case "never":
                shouldCapture = false;
                break;
            default:
                // Default to on-failure
                shouldCapture = "failed".equalsIgnoreCase(testStatus) ||
                               "broken".equalsIgnoreCase(testStatus);
        }

        if (shouldCapture) {
            String prefix = "end-" + sanitizeTestName(testName) + "-" + testStatus.toLowerCase();
            captureScreenshot(prefix);
        }
    }

    private String sanitizeTestName(String testName) {
        // Remove special characters and limit length
        return testName.replaceAll("[^a-zA-Z0-9]", "-")
                       .substring(0, Math.min(testName.length(), 50));
    }
}
