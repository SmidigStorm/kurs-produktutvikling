Feature: Queue position

  Patients waiting at the legevakt want to know where they are in the queue
  and roughly how long they will wait.

  Background:
    Given the clinic queue is empty

  Scenario: A patient sees their position and estimated wait
    Given "Kari" arrived 60 minutes ago with triage level "GREEN"
    And "Ola" arrived 30 minutes ago with triage level "GREEN"
    When "Ola" opens their queue view
    Then they see position 2
    And they see an estimated wait of 15 minutes

  Scenario: A more urgent arrival moves ahead of everyone waiting
    Given "Kari" arrived 60 minutes ago with triage level "GREEN"
    And "Maja" arrived 5 minutes ago with triage level "RED"
    When "Kari" opens their queue view
    Then they see position 2

  Scenario: The waiting patient sees their position change without reloading
    Given "Kari" arrived 60 minutes ago with triage level "GREEN"
    And "Kari" opens their queue view
    And they see position 1
    When "Maja" arrives now with triage level "RED"
    And the page refreshes itself
    Then they see position 2
