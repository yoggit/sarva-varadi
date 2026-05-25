*** Settings ***
Documentation    Shared UI keywords and variables
Library          Browser

*** Keywords ***
Navigate To
    [Arguments]    ${url}
    Go To    ${url}
