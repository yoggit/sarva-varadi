*** Settings ***
Documentation     Login and authentication UI tests
Library           Browser
Resource          ../../resources/common.resource
Suite Setup       Open Browser To Login Page
Suite Teardown    Close Browser

*** Variables ***
${BASE_URL}       https://demo.example.com
${VALID_USER}     testuser@example.com
${VALID_PASS}     Test@1234

*** Test Cases ***
Valid Login With Correct Credentials
    [Documentation]    User can log in with valid username and password
    [Tags]    severity:critical    tms:AUTH-001    smoke
    Navigate To    ${BASE_URL}/login
    Fill Login Form    ${VALID_USER}    ${VALID_PASS}
    Click Login Button
    Dashboard Should Be Visible
    Welcome Message Should Contain    testuser

Invalid Login With Wrong Password
    [Documentation]    Login fails with incorrect password and shows error
    [Tags]    severity:high    tms:AUTH-002    regression
    Navigate To    ${BASE_URL}/login
    Fill Login Form    ${VALID_USER}    wrong_password
    Click Login Button
    Error Message Should Be Visible
    Error Message Should Contain    Invalid credentials

Login With Empty Username
    [Documentation]    Login form validates empty username field
    [Tags]    severity:normal    tms:AUTH-003    regression
    Navigate To    ${BASE_URL}/login
    Fill Login Form    ${EMPTY}    ${VALID_PASS}
    Click Login Button
    Field Validation Error Should Be Visible    username

Login With Empty Password
    [Documentation]    Login form validates empty password field
    [Tags]    severity:normal    tms:AUTH-004    regression
    Navigate To    ${BASE_URL}/login
    Fill Login Form    ${VALID_USER}    ${EMPTY}
    Click Login Button
    Field Validation Error Should Be Visible    password

Logout Clears Session
    [Documentation]    User session is cleared after logout
    [Tags]    severity:high    tms:AUTH-005    regression
    Login As    ${VALID_USER}    ${VALID_PASS}
    Click Logout Button
    Login Page Should Be Visible
    Navigate To    ${BASE_URL}/dashboard
    Should Be Redirected To Login

Remember Me Persists Session
    [Documentation]    Remember me checkbox keeps user logged in across sessions
    [Tags]    severity:normal    tms:AUTH-006    regression
    Navigate To    ${BASE_URL}/login
    Fill Login Form    ${VALID_USER}    ${VALID_PASS}
    Check Remember Me
    Click Login Button
    Dashboard Should Be Visible

*** Keywords ***
Open Browser To Login Page
    New Browser    chromium    headless=True
    New Page    ${BASE_URL}/login

Fill Login Form
    [Arguments]    ${username}    ${password}
    Fill Text    id=username    ${username}
    Fill Text    id=password    ${password}

Click Login Button
    Click    id=login-btn

Dashboard Should Be Visible
    Wait For Elements State    id=dashboard-header    visible

Welcome Message Should Contain
    [Arguments]    ${text}
    Get Text    id=welcome-msg    contains    ${text}

Error Message Should Be Visible
    Wait For Elements State    id=login-error    visible

Error Message Should Contain
    [Arguments]    ${text}
    Get Text    id=login-error    contains    ${text}

Field Validation Error Should Be Visible
    [Arguments]    ${field}
    Wait For Elements State    id=${field}-error    visible

Login As
    [Arguments]    ${username}    ${password}
    Navigate To    ${BASE_URL}/login
    Fill Login Form    ${username}    ${password}
    Click Login Button
    Dashboard Should Be Visible

Click Logout Button
    Click    id=logout-btn

Login Page Should Be Visible
    Wait For Elements State    id=login-btn    visible

Should Be Redirected To Login
    Get Url    contains    /login

Check Remember Me
    Check Checkbox    id=remember-me
