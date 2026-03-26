Feature: Variant Creation
  Scenario: Create a randomized variant for a valid exam
    Given an exam exists with 3 questions
    When I request a new variant for that exam
    Then the response includes a variantId and examNumber
      And the variant has 3 questions
      And each question has shuffledChoiceIds

  Scenario: Reject variant creation for exam with no questions
    Given an exam exists with zero questionIds
    When I request a new variant for that exam
    Then the response status is 400
      And the error is "Exam has no questions"
