package io.github.yoggit.sarvavaradi;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Configuration loader for Sarva-Varadi Selenium integration
 * Reads from sarva-varadi.properties file in project root or src/test/resources
 * Command-line properties (-D) take precedence over file properties
 */
public class SarvaVaradiConfig {

    private static final Properties config = new Properties();
    private static boolean loaded = false;

    static {
        loadConfig();
    }

    /**
     * Load configuration from properties file
     * Search order:
     * 1. sarva-varadi.properties in project root
     * 2. src/test/resources/sarva-varadi.properties
     * 3. classpath:sarva-varadi.properties
     */
    private static void loadConfig() {
        if (loaded) return;

        String[] locations = {
            "sarva-varadi.properties",
            "src/test/resources/sarva-varadi.properties"
        };

        // Try file system locations first
        for (String location : locations) {
            try (FileInputStream fis = new FileInputStream(location)) {
                config.load(fis);
                System.out.println("✅ Sarva-Varadi: Loaded config from " + location);
                loaded = true;
                return;
            } catch (IOException e) {
                // Try next location
            }
        }

        // Try classpath
        try (InputStream is = SarvaVaradiConfig.class.getClassLoader()
                .getResourceAsStream("sarva-varadi.properties")) {
            if (is != null) {
                config.load(is);
                System.out.println("✅ Sarva-Varadi: Loaded config from classpath");
                loaded = true;
                return;
            }
        } catch (IOException e) {
            // Config file not found, use defaults
        }

        System.out.println("ℹ️  Sarva-Varadi: No config file found, using defaults");
        loaded = true;
    }

    /**
     * Get property value with precedence:
     * 1. System property (-Dkey=value)
     * 2. Property file value
     * 3. Default value
     */
    public static String getProperty(String key, String defaultValue) {
        // System property takes precedence
        String systemValue = System.getProperty(key);
        if (systemValue != null) {
            return systemValue;
        }

        // Then property file
        String fileValue = config.getProperty(key);
        if (fileValue != null) {
            return fileValue;
        }

        // Finally default
        return defaultValue;
    }

    /**
     * Get boolean property
     */
    public static boolean getBooleanProperty(String key, boolean defaultValue) {
        String value = getProperty(key, String.valueOf(defaultValue));
        return Boolean.parseBoolean(value);
    }

    /**
     * Get integer property
     */
    public static int getIntProperty(String key, int defaultValue) {
        String value = getProperty(key, String.valueOf(defaultValue));
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Screenshot capture mode
     */
    public static String getScreenshotMode() {
        return getProperty("sarva.screenshot", "on-failure");
    }

    /**
     * Sensitive data masking
     */
    public static boolean isMaskSensitiveData() {
        return getBooleanProperty("sarva.maskSensitiveData", false);
    }

    /**
     * Output directory
     */
    public static String getOutputDir() {
        return getProperty("sarva.outputDir", "sarva-varadi-results");
    }

    /**
     * Screenshot directory
     */
    public static String getScreenshotDir() {
        return getProperty("sarva.screenshotDir", "sarva-varadi-results/screenshots");
    }

    /**
     * Max retry count
     */
    public static int getMaxRetryCount() {
        return getIntProperty("sarva.maxRetryCount", 2);
    }

    /**
     * Reload configuration (useful for testing)
     */
    public static void reload() {
        config.clear();
        loaded = false;
        loadConfig();
    }
}
