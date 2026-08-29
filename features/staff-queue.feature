Feature: Staff queue management

  Staff register arrivals and re-triage patients as their condition changes.

  Background:
    Given the clinic queue is empty
    And staff open the queue

  Scenario: Registering an arrival puts the patient in the queue
    When staff register "Nils Aas" with triage level "YELLOW"
    Then the queue shows "Nils Aas" at position 1

  Scenario: Re-triaging a patient moves them to the front
    Given "Kari" arrived 60 minutes ago with triage level "GREEN"
    And "Jonas" arrived 10 minutes ago with triage level "BLUE"
    When staff re-triage "Jonas" to "RED"
    Then the queue shows "Jonas" at position 1

  Scenario: Marking a patient done removes them from the queue
    Given "Kari" arrived 60 minutes ago with triage level "GREEN"
    And "Ola" arrived 30 minutes ago with triage level "GREEN"
    When staff mark "Kari" as done
    Then the queue shows "Ola" at position 1
