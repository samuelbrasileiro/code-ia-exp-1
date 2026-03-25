Feature: Questions CRUD With Multiple Correct Choices
  Scenario: Create a question with multiple correct choices
    Given the questions store is empty
    When I create a question with prompt "Select prime numbers"
      And choices:
        | text |
        | 2    |
        | 3    |
        | 4    |
        | 5    |
      And correct indexes: 0, 1, 3
    Then the response status is 201
      And the question has 4 choices
      And the question has 3 correctChoiceIds

  Scenario: Update a question and change correct choices
    Given a question exists with prompt "Select vowels"
    When I update the question with choices:
      | text |
      | A    |
      | B    |
      | E    |
      | I    |
      And correct indexes: 0, 2, 3
    Then the response status is 200
      And the question has 3 correctChoiceIds

  Scenario: Reject duplicate correct indexes
    Given the questions store is empty
    When I create a question with prompt "Select even numbers"
      And choices:
        | text |
        | 2    |
        | 4    |
      And correct indexes: 0, 0
    Then the response status is 400
      And the error is "Duplicate correct indexes are not allowed"

  Scenario: Reject out-of-range correct indexes
    Given the questions store is empty
    When I create a question with prompt "Select colors"
      And choices:
        | text |
        | Red  |
        | Blue |
      And correct indexes: 2
    Then the response status is 400
      And the error is "correctIndexes out of range"

  Scenario: Delete an existing question
    Given a question exists with prompt "Select mammals"
    When I delete the question
    Then the response status is 204
      And the question is no longer in the list
