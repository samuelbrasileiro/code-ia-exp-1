Feature: CSV Delimiters And Parsing
  Scenario: Accept semicolon-delimited CSV files
    Given a semicolon-delimited answer key CSV with valid columns
      And a semicolon-delimited student answers CSV with valid columns
    When I run correction
    Then the response status is 200
