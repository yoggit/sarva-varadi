package com.example.cucumber;

import org.junit.platform.suite.api.*;

import static io.cucumber.junit.platform.engine.Constants.*;

@Suite
@IncludeEngines("cucumber")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME,   value = "io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME,     value = "com.example.cucumber")
@ConfigurationParameter(key = FEATURES_PROPERTY_NAME, value = "src/test/resources/features")
public class CucumberTestRunner {
}
