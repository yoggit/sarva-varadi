package io.github.yoggit.sarvavaradi;

import org.openqa.selenium.*;
import org.openqa.selenium.support.events.WebDriverListener;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.util.*;

/**
 * WebDriver event listener that captures browser actions and screenshots for Sarva-Varadi.
 *
 * Wrap your WebDriver in setUp:
 *   SarvaVaradiWebDriverListener listener = new SarvaVaradiWebDriverListener(driver);
 *   driver = new EventFiringDecorator<>(listener).decorate(driver);
 */
public class SarvaVaradiWebDriverListener implements WebDriverListener {

    private final String screenshotDir;
    private final boolean maskSensitive;
    private final String screenshotMode;
    private final WebDriver driver;

    private final List<Map<String, Object>> actions = Collections.synchronizedList(new ArrayList<>());
    private int screenshotCounter = 0;

    public SarvaVaradiWebDriverListener(WebDriver driver) {
        this.driver = driver;
        this.screenshotDir = SarvaVaradiConfig.getScreenshotDir();
        this.maskSensitive = SarvaVaradiConfig.isMaskSensitiveData();
        this.screenshotMode = SarvaVaradiConfig.getScreenshotMode();
        createScreenshotDirectory();
        SarvaVaradiContext.setListener(this);
    }

    private void createScreenshotDirectory() {
        try {
            Files.createDirectories(new File(screenshotDir).toPath());
        } catch (IOException e) {
            System.err.println("Sarva-Varadi: Failed to create screenshot directory: " + e.getMessage());
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
        recordAction("click", "Click on " + elementInfo(element), null);
    }

    @Override
    public void afterClick(WebElement element) {
        recordAction("click", "Clicked successfully", "success");
    }

    @Override
    public void beforeSendKeys(WebElement element, CharSequence... keys) {
        String value = Arrays.toString(keys);
        if (maskSensitive && isSensitiveField(element)) value = "***";
        recordAction("sendKeys", "Type into " + elementInfo(element) + ": " + value, null);
    }

    @Override
    public void afterSendKeys(WebElement element, CharSequence... keys) {
        recordAction("sendKeys", "Typed successfully", "success");
    }

    @Override
    public void beforeFindElement(WebDriver driver, By locator) {
        recordAction("findElement", "Find: " + locator, null);
    }

    @Override
    public void afterFindElement(WebDriver driver, By locator, WebElement result) {
        recordAction("findElement", "Found element", "success");
    }

    @Override
    public void onError(Object target, Method method, Object[] args, InvocationTargetException e) {
        recordAction("error", "Error: " + e.getCause().getMessage(), "failed");
        captureScreenshot("error");
    }

    public void captureTestEndScreenshot(String testName, String testStatus) {
        boolean shouldCapture;
        switch (screenshotMode.toLowerCase()) {
            case "always": shouldCapture = true; break;
            case "never":  shouldCapture = false; break;
            default:       shouldCapture = "failed".equalsIgnoreCase(testStatus) || "broken".equalsIgnoreCase(testStatus);
        }

        if (shouldCapture) {
            String prefix = "end-" + sanitize(testName) + "-" + testStatus.toLowerCase();
            captureScreenshot(prefix);
        }
    }

    private void captureScreenshot(String prefix) {
        try {
            if (driver instanceof TakesScreenshot) {
                TakesScreenshot ts = (TakesScreenshot) driver;
                File src = ts.getScreenshotAs(OutputType.FILE);
                String filename = prefix + "-" + (++screenshotCounter) + ".png";
                File dest = new File(screenshotDir, filename);
                Files.copy(src.toPath(), dest.toPath());

                Map<String, Object> action = new HashMap<>();
                action.put("type", "screenshot");
                action.put("description", "Screenshot: " + filename);
                action.put("file", filename);
                action.put("timestamp", System.currentTimeMillis());
                actions.add(action);
            }
        } catch (Exception e) {
            System.err.println("Sarva-Varadi: Failed to capture screenshot: " + e.getMessage());
        }
    }

    private void recordAction(String type, String description, String status) {
        Map<String, Object> action = new HashMap<>();
        action.put("type", type);
        action.put("description", description);
        action.put("timestamp", System.currentTimeMillis());
        if (status != null) action.put("status", status);
        actions.add(action);
    }

    private String elementInfo(WebElement element) {
        try {
            String tag = element.getTagName();
            String id = element.getAttribute("id");
            String name = element.getAttribute("name");
            String cls = element.getAttribute("class");

            if (id != null && !id.isEmpty()) return tag + "#" + id;
            if (name != null && !name.isEmpty()) return tag + "[name=" + name + "]";
            if (cls != null && !cls.isEmpty()) return tag + "." + cls.split(" ")[0];
            return tag;
        } catch (Exception e) {
            return "element";
        }
    }

    private boolean isSensitiveField(WebElement element) {
        try {
            String type = element.getAttribute("type");
            String name = element.getAttribute("name");
            String id = element.getAttribute("id");
            if ("password".equalsIgnoreCase(type)) return true;
            for (String kw : new String[]{"password", "pwd", "secret", "token", "apikey"}) {
                if ((name != null && name.toLowerCase().contains(kw)) ||
                    (id != null && id.toLowerCase().contains(kw))) return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private String sanitize(String name) {
        String s = name.replaceAll("[^a-zA-Z0-9]", "-");
        return s.length() > 50 ? s.substring(0, 50) : s;
    }

    public List<Map<String, Object>> getActions() {
        return new ArrayList<>(actions);
    }

    public void clearActions() {
        actions.clear();
    }
}
