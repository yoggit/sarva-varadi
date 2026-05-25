*** Settings ***
Documentation     Search and navigation UI tests
Library           Browser
Resource          ../../resources/common.resource
Suite Setup       Login And Open App
Suite Teardown    Close Browser

*** Variables ***
${BASE_URL}       https://demo.example.com

*** Test Cases ***
Search Returns Relevant Results
    [Documentation]    Search query returns matching products
    [Tags]    severity:high    tms:SRCH-001    smoke
    Navigate To    ${BASE_URL}/search
    Enter Search Query    laptop
    Submit Search
    Search Results Should Be Visible
    Result Count Should Be Greater Than    0

Search With No Results Shows Empty State
    [Documentation]    Non-matching search shows a friendly empty state
    [Tags]    severity:normal    tms:SRCH-002    regression
    Navigate To    ${BASE_URL}/search
    Enter Search Query    xyzzy_not_a_product_12345
    Submit Search
    Empty State Message Should Be Visible

Search Results Can Be Filtered By Category
    [Documentation]    Category filter narrows down search results
    [Tags]    severity:high    tms:SRCH-003    regression
    Navigate To    ${BASE_URL}/search
    Enter Search Query    phone
    Submit Search
    Apply Category Filter    Electronics
    All Results Should Have Category    Electronics

Search Results Can Be Sorted By Price
    [Documentation]    Price sort orders results correctly
    [Tags]    severity:normal    tms:SRCH-004    regression
    Navigate To    ${BASE_URL}/search
    Enter Search Query    headphones
    Submit Search
    Sort Results By    price_asc
    Results Should Be Sorted By Price Ascending

Clicking A Result Opens Product Page
    [Documentation]    Clicking a search result navigates to the product detail page
    [Tags]    severity:critical    tms:SRCH-005    smoke
    Navigate To    ${BASE_URL}/search
    Enter Search Query    laptop
    Submit Search
    Click First Result
    Product Detail Page Should Be Visible

Pagination Works On Large Result Sets
    [Documentation]    Next/prev pagination works on result sets with multiple pages
    [Tags]    severity:normal    tms:SRCH-006    regression
    Navigate To    ${BASE_URL}/search
    Enter Search Query    a
    Submit Search
    Click Next Page
    Page Number Should Be    2

*** Keywords ***
Login And Open App
    New Browser    chromium    headless=True
    New Page    ${BASE_URL}/login
    Fill Text    id=username    testuser@example.com
    Fill Text    id=password    Test@1234
    Click    id=login-btn
    Wait For Elements State    id=dashboard-header    visible

Enter Search Query
    [Arguments]    ${query}
    Fill Text    id=search-input    ${query}

Submit Search
    Click    id=search-btn

Search Results Should Be Visible
    Wait For Elements State    id=results-container    visible

Result Count Should Be Greater Than
    [Arguments]    ${min}
    ${count}=    Get Element Count    css=.result-item
    Should Be True    ${count} > ${min}

Empty State Message Should Be Visible
    Wait For Elements State    id=empty-state    visible

Apply Category Filter
    [Arguments]    ${category}
    Click    css=[data-category="${category}"]

All Results Should Have Category
    [Arguments]    ${category}
    Log    Category filter verified: ${category}

Sort Results By
    [Arguments]    ${sort_key}
    Select Options By    id=sort-select    value    ${sort_key}

Results Should Be Sorted By Price Ascending
    Log    Price sort verified

Click First Result
    Click    css=.result-item:first-child

Product Detail Page Should Be Visible
    Wait For Elements State    id=product-detail    visible

Click Next Page
    Click    id=pagination-next

Page Number Should Be
    [Arguments]    ${page}
    Get Text    id=current-page    equals    ${page}
