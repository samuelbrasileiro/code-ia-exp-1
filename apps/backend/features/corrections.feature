Feature: Corrections Strict vs Lenient
  Scenario: Strict mode requires exact set match
    Given an answer key with question1-answer "A|C"
      And a student answers row with question1-answer "C|A"
    When I run correction in "strict" mode
    Then the student gets full credit for question 1

  Scenario: Strict mode rejects partial matches
    Given an answer key with question1-answer "A|C"
      And a student answers row with question1-answer "A"
    When I run correction in "strict" mode
    Then the student gets 0 points for question 1

  Scenario: Lenient mode awards partial credit
    Given an answer key with question1-answer "A|C"
      And a student answers row with question1-answer "A|B"
    When I run correction in "lenient" mode
    Then the student receives partial credit for question 1
      And the score is greater than 0 and less than 1

  Scenario: Powers-of-two correction compares sums
    Given an answer key with question1-answer "5"
      And a student answers row with question1-answer "1|4"
    When I run correction in "strict" mode
    Then the student gets full credit for question 1

  Scenario: Reject missing exam-id column in key CSV
    Given an answer key CSV without "exam-id"
    When I run correction
    Then the response status is 400
      And the error mentions "exam-id"

  Scenario: Reject missing question columns in key CSV
    Given an answer key CSV without question1-answer columns
    When I run correction
    Then the response status is 400
      And the error mentions "question1-answer"

  Scenario: Reject missing question columns in student answers CSV
    Given a student answers CSV without question1-answer columns
    When I run correction
    Then the response status is 400
      And the error mentions "question1-answer"

  Scenario: Reject unknown exam-id in student answers
    Given an answer key CSV for exam-id "EXAM-001"
      And a student answers row with exam-id "EXAM-999"
    When I run correction
    Then the response status is 400
      And the error mentions "Unknown exam-id"
