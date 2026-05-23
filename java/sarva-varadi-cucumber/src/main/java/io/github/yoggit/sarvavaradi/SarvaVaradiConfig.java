package io.github.yoggit.sarvavaradi;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Configuration for Sarva-Varadi Selenium integration.
 *
 * Reads from sarva-varadi.properties (project root or src/test/resources).
 * System properties (-D) take precedence over file properties.
 *
 * Supported properties:
 *   sarva.outputDir       — default: sarva-varadi-results
 *   sarva.screenshotDir   — default: sarva-varadi-results/screenshots
 *   sarva.screenshot      — always | on-failure | never  (default: on-failure)
 *   sarva.maskSensitiveData — true | false  (default: false)
 *   sarva.maxRetryCount   — integer  (default: 2)
 */
public class SarvaVaradiConfig {

    private static final Properties config = new Properties();
    private static boolean loaded = false;

    static {
        loadConfig();
    }

    private static void loadConfig() {
        if (loaded) return;

        String[] locations = {
            "sarva-varadi.properties",
            "src/test/resources/sarva-varadi.properties",
            "../sarva-varadi.properties"
        };

        for (String location : locations) {
            try (FileInputStream fis = new FileInputStream(location)) {
                config.load(fis);
                System.out.println("✅ Sarva-Varadi: Loaded config from " + location);
                loaded = true;
                return;
            } catch (IOException e) {
                // try next location
            }
        }

        try (InputStream is = SarvaVaradiConfig.class.getClassLoader()
                .getResourceAsStream("sarva-varadi.properties")) {
            if (is != null) {
                config.load(is);
                System.out.println("✅ Sarva-Varadi: Loaded config from classpath");
                loaded = true;
                return;
            }
        } catch (IOException e) {
            // fall through to defaults
        }

        System.out.println("ℹ️  Sarva-Varadi: Using default configuration");
        loaded = true;
    }

    public static String getProperty(String key, String defaultValue) {
        String sys = System.getProperty(key);
        if (sys != null) return sys;
        String file = config.getProperty(key);
        return file != null ? file : defaultValue;
    }

    public static boolean getBooleanProperty(String key, boolean defaultValue) {
        return Boolean.parseBoolean(getProperty(key, String.valueOf(defaultValue)));
    }

    public static int getIntProperty(String key, int defaultValue) {
        try {
            return Integer.parseInt(getProperty(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public static String getOutputDir()      { return getProperty("sarva.outputDir", "sarva-varadi-results"); }
    public static String getScreenshotDir()  { return getProperty("sarva.screenshotDir", "sarva-varadi-results/screenshots"); }
    public static String getScreenshotMode() { return getProperty("sarva.screenshot", "on-failure"); }
    public static boolean isMaskSensitiveData() { return getBooleanProperty("sarva.maskSensitiveData", false); }
    public static int getMaxRetryCount()     { return getIntProperty("sarva.maxRetryCount", 2); }

    public static void reload() {
        config.clear();
        loaded = false;
        loadConfig();
    }
}
