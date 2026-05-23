@api-docs @selenium
Feature: Selenium API Documentation

  Background:
    Given a Chrome browser is launched

  @blog
  Scenario: Blog page is accessible
    When I navigate to "https://www.selenium.dev/blog/"
    Then the page title should contain "Selenium"

  @webdriver-api @issue:15 @tms:6
  Scenario: WebDriver API reference loads
    When I navigate to "https://www.selenium.dev/documentation/webdriver/getting_started/"
    Then the main heading should be visible
    And the page has content
