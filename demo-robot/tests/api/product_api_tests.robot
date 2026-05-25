*** Settings ***
Documentation     Product catalogue API tests
Library           RequestsLibrary
Library           Collections
Resource          ../../resources/api_common.resource
Suite Setup       Create API Session
Suite Teardown    Delete All Sessions

*** Variables ***
${BASE_URL}       https://api.demo.example.com
${API_KEY}        demo-api-key-12345

*** Test Cases ***
GET All Products Returns 200
    [Documentation]    GET /products returns HTTP 200 with product list
    [Tags]    severity:critical    tms:PRD-001    smoke
    ${response}=    GET On Session    api    /products
    Should Be Equal As Integers    ${response.status_code}    200
    ${products}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${products}

GET Product By ID Returns Correct Data
    [Documentation]    GET /products/{id} returns correct product fields
    [Tags]    severity:high    tms:PRD-002    regression
    ${response}=    GET On Session    api    /products/1
    Should Be Equal As Integers    ${response.status_code}    200
    ${product}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${product}    name
    Dictionary Should Contain Key    ${product}    price
    Dictionary Should Contain Key    ${product}    stock

GET Products Filtered By Category
    [Documentation]    GET /products?category=Electronics returns filtered list
    [Tags]    severity:high    tms:PRD-003    regression
    ${params}=    Create Dictionary    category=Electronics
    ${response}=    GET On Session    api    /products    params=${params}
    Should Be Equal As Integers    ${response.status_code}    200

POST Create Product Returns 201
    [Documentation]    POST /products creates a new product entry
    [Tags]    severity:critical    tms:PRD-004    smoke
    ${payload}=    Create Dictionary
    ...    name=Wireless Headphones Pro
    ...    price=${129.99}
    ...    category=Electronics
    ...    stock=${50}
    ${response}=    POST On Session    api    /products    json=${payload}
    Should Be Equal As Integers    ${response.status_code}    201
    ${created}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${created}    id

POST Create Product With Negative Price Returns 400
    [Documentation]    POST /products with negative price fails validation
    [Tags]    severity:normal    tms:PRD-005    regression
    ${payload}=    Create Dictionary    name=Bad Product    price=${-10}    category=Electronics
    ${response}=    POST On Session    api    /products    json=${payload}    expected_status=400
    Should Be Equal As Integers    ${response.status_code}    400

PUT Update Product Stock
    [Documentation]    PUT /products/{id} updates stock quantity
    [Tags]    severity:high    tms:PRD-006    regression
    ${payload}=    Create Dictionary    stock=${100}
    ${response}=    PUT On Session    api    /products/1    json=${payload}
    Should Be Equal As Integers    ${response.status_code}    200
    ${updated}=    Set Variable    ${response.json()}
    Should Be Equal As Integers    ${updated}[stock]    100

GET Products Sorted By Price
    [Documentation]    GET /products?sort=price_asc returns price-ordered list
    [Tags]    severity:normal    tms:PRD-007    regression
    ${params}=    Create Dictionary    sort=price_asc
    ${response}=    GET On Session    api    /products    params=${params}
    Should Be Equal As Integers    ${response.status_code}    200

DELETE Product Returns 204
    [Documentation]    DELETE /products/{id} removes product and returns 204
    [Tags]    severity:high    tms:PRD-008    regression
    ${response}=    DELETE On Session    api    /products/99    expected_status=204
    Should Be Equal As Integers    ${response.status_code}    204

GET Out Of Stock Products
    [Documentation]    GET /products?stock=0 returns only out-of-stock items
    [Tags]    severity:normal    tms:PRD-009    regression
    ${params}=    Create Dictionary    stock=0
    ${response}=    GET On Session    api    /products    params=${params}
    Should Be Equal As Integers    ${response.status_code}    200

*** Keywords ***
Create API Session
    ${headers}=    Create Dictionary    x-api-key=${API_KEY}    Content-Type=application/json
    Create Session    api    ${BASE_URL}    headers=${headers}
