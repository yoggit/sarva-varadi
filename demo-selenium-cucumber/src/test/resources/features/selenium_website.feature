@smoke @selenium @website
Feature: Selenium Website Navigation

  Background:
    Given a Chrome browser is launched

  @homepage @tms:1
  Scenario: Homepage loads with correct title
    When I navigate to "https://www.selenium.dev/"
    Then the page title should contain "Selenium"
    And the navigation bar should be present

  @documentation
  Scenario: Documentation page is accessible
    When I navigate to "https://www.selenium.dev/documentation/"
    Then the page title should not be empty
    And the main heading should be visible

  @downloads @issue:7 @tms:3
  Scenario: Downloads page loads successfully
    When I navigate to "https://www.selenium.dev/downloads/"
    Then the page title should not be empty
    And the page has content

  @webdriver @issue:12 @tms:4
  Scenario: WebDriver docs display content
    When I navigate to "https://www.selenium.dev/documentation/webdriver/"
    Then the main heading should be visible
    And the page has content

  @ecosystem
  Scenario: Ecosystem page is reachable
    When I navigate to "https://www.selenium.dev/ecosystem/"
    Then the page title should not be empty
    And the page has content

  @getting-started
  Scenario: Getting started guide is accessible
    When I navigate to "https://www.selenium.dev/documentation/overview/"
    Then the main heading should be visible
