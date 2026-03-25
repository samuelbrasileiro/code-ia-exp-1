Feature: Answer Key CSV Format
  Scenario: Answer key CSV uses the header format
    Given an exam exists with 2 questions
      And I generated 2 variants for the exam
    When I extract the answer key CSV from the zip
    Then the header row is:
      | exam-id | question1-answer | question2-answer |

  Scenario: Letters mode uses pipe-delimited correct labels
    Given an exam exists in "letters" mode
      And question 1 has correct choices A and C
    When I generate the answer key CSV for a controlled variant
    Then the value for question1-answer is "A|C"

  Scenario: Powers-of-two mode uses summed values
    Given an exam exists in "powersOfTwo" mode
      And question 1 has correct choices with labels 1 and 4
    When I generate the answer key CSV for a controlled variant
    Then the value for question1-answer is "5"

  Scenario: Single-variant answer key download uses the same format
    Given an exam exists with 3 questions
      And a variant exists for the exam
    When I download the answer key for that variant
    Then the CSV header matches "exam-id,question1-answer,question2-answer,question3-answer"
