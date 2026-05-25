*** Settings ***
Documentation     User API tests using RequestsLibrary
Library           RequestsLibrary
Library           Collections
Resource          ../../resources/api_common.resource
Suite Setup       Create API Session
Suite Teardown    Delete All Sessions

*** Variables ***
${BASE_URL}       https://api.demo.example.com
${API_KEY}        demo-api-key-12345

*** Test Cases ***
GET All Users Returns 200
    [Documentation]    GET /users returns HTTP 200 with a list of users
    [Tags]    severity:critical    tms:USR-001    smoke
    ${response}=    GET On Session    api    /users
    Should Be Equal As Integers    ${response.status_code}    200
    ${users}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${users}

GET User By ID Returns Correct User
    [Documentation]    GET /users/{id} returns the correct user object
    [Tags]    severity:high    tms:USR-002    regression
    ${response}=    GET On Session    api    /users/1
    Should Be Equal As Integers    ${response.status_code}    200
    ${user}=    Set Variable    ${response.json()}
    Should Be Equal    ${user}[id]    ${1}
    Dictionary Should Contain Key    ${user}    email
    Dictionary Should Contain Key    ${user}    name

GET Non-Existent User Returns 404
    [Documentation]    GET /users/{id} for missing user returns HTTP 404
    [Tags]    severity:high    tms:USR-003    regression
    ${response}=    GET On Session    api    /users/99999    expected_status=404
    Should Be Equal As Integers    ${response.status_code}    404

POST Create User Returns 201
    [Documentation]    POST /users creates a new user and returns HTTP 201
    [Tags]    severity:critical    tms:USR-004    smoke
    ${payload}=    Create Dictionary
    ...    name=John Doe
    ...    email=john.doe@example.com
    ...    role=viewer
    ${response}=    POST On Session    api    /users    json=${payload}
    Should Be Equal As Integers    ${response.status_code}    201
    ${created}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${created}    id
    Should Be Equal    ${created}[email]    john.doe@example.com

POST Create User With Missing Email Returns 400
    [Documentation]    POST /users without email returns HTTP 400 validation error
    [Tags]    severity:normal    tms:USR-005    regression
    ${payload}=    Create Dictionary    name=No Email User
    ${response}=    POST On Session    api    /users    json=${payload}    expected_status=400
    Should Be Equal As Integers    ${response.status_code}    400
    ${error}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${error}    message

PUT Update User Returns 200
    [Documentation]    PUT /users/{id} updates user fields and returns HTTP 200
    [Tags]    severity:high    tms:USR-006    regression
    ${payload}=    Create Dictionary    name=Updated Name    role=admin
    ${response}=    PUT On Session    api    /users/1    json=${payload}
    Should Be Equal As Integers    ${response.status_code}    200
    ${updated}=    Set Variable    ${response.json()}
    Should Be Equal    ${updated}[name]    Updated Name

DELETE User Returns 204
    [Documentation]    DELETE /users/{id} removes user and returns HTTP 204
    [Tags]    severity:high    tms:USR-007    regression
    ${response}=    DELETE On Session    api    /users/2    expected_status=204
    Should Be Equal As Integers    ${response.status_code}    204

GET Deleted User Returns 404
    [Documentation]    GET on a deleted user returns HTTP 404
    [Tags]    severity:normal    tms:USR-008    regression
    ${response}=    GET On Session    api    /users/2    expected_status=404
    Should Be Equal As Integers    ${response.status_code}    404

GET Users Supports Pagination
    [Documentation]    GET /users?page=2&limit=5 returns paginated results
    [Tags]    severity:normal    tms:USR-009    regression
    ${params}=    Create Dictionary    page=2    limit=5
    ${response}=    GET On Session    api    /users    params=${params}
    Should Be Equal As Integers    ${response.status_code}    200
    ${body}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${body}    data
    Dictionary Should Contain Key    ${body}    total

*** Keywords ***
Create API Session
    ${headers}=    Create Dictionary    x-api-key=${API_KEY}    Content-Type=application/json
    Create Session    api    ${BASE_URL}    headers=${headers}
