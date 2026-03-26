Feature: Exam Creation With Labeling Modes
  Scenario: Create an exam with letters mode
    Given at least 2 questions exist
    When I create an exam with answerLabelingMode "letters"
      And questionIds include those 2 questions
    Then the response status is 201
      And the exam answerLabelingMode is "letters"
      And the exam has those questionIds

  Scenario: Create an exam with powers-of-two mode
    Given at least 2 questions exist
    When I create an exam with answerLabelingMode "powersOfTwo"
      And questionIds include those 2 questions
    Then the response status is 201
      And the exam answerLabelingMode is "powersOfTwo"

  Scenario: Reject exam creation with unknown questionIds
    Given the questions store is empty
    When I create an exam with questionIds: "q-missing-1"
    Then the response status is 400
      And the error is "Unknown questionIds"

  Scenario: Reject exam creation with no questionIds
    Given at least 1 question exists
    When I create an exam with an empty questionIds array
    Then the response status is 400
