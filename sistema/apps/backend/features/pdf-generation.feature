Feature: Generate PDFs With Header and Footer
  Scenario: Generate a single PDF for a variant
    Given an exam exists with answerLabelingMode "letters"
      And a valid variant exists for that exam
    When I request a PDF for the variant
    Then the response is a PDF
      And the PDF header includes the exam title, subject, teacher, date, and answer labels
      And the PDF footer includes the exam number

  Scenario: Generate N PDFs as a zip with answer key
    Given an exam exists with at least 1 question
    When I request a PDF zip with copies 3
    Then the response is a zip file
      And the zip contains 3 PDF files
      And each PDF has a header and footer
      And the zip contains one answer key CSV

  Scenario: Reject PDF zip with copies below 1
    Given an exam exists
    When I request a PDF zip with copies 0
    Then the response status is 400

  Scenario: Reject PDF zip with copies above 100
    Given an exam exists
    When I request a PDF zip with copies 101
    Then the response status is 400

  Scenario: Record PDF generation history
    Given an exam exists
    When I generate a PDF zip with copies 2
    Then the PDF history for that exam includes a record
      And the record includes copies 2 and the variantIds
