@LEGE-10
Feature: Consultation room

  Staff see who is in the consultation room above the queue, and the patient
  in the room sees that they are being seen.

  # LEGE-10. The same rules and examples are in the work item. Change both.

  Background:
    Given the clinic queue is empty

  Rule: The patient in consultation is shown above the queue, with name and level

    One line, always in the same place above the waiting rows: "Consultation room:
    Kari, GREEN" when someone is in, with the name as staff registered it;
    "Consultation room: free" when nobody is. One room: while it is taken, the API
    refuses to put a second patient in consultation.

    Scenario: The patient in the room is shown above the waiting queue
      Given "Kari" arrived 60 minutes ago with triage level "GREEN"
      And "Ola" arrived 30 minutes ago with triage level "GREEN"
      And "Kari" is in consultation
      When staff open the queue
      Then the consultation room shows "Kari", "GREEN"
      And the queue shows "Ola" at position 1

    Scenario: An empty room says so
      Given "Ola" arrived 30 minutes ago with triage level "GREEN"
      When staff open the queue
      Then the consultation room is shown as free

  Rule: Staff can mark the patient in consultation done from that row

    Scenario: Marking the patient in the room done frees the room
      Given "Kari" arrived 60 minutes ago with triage level "GREEN"
      And "Kari" is in consultation
      And staff open the queue
      When staff mark "Kari" as done
      Then the consultation room is shown as free

  Rule: A patient in consultation sees that they are being seen

    The line replaces the position and the estimated wait. An open page shows it
    by itself, like every other change.

    Scenario: The patient in the room sees they are being seen
      Given "Kari" arrived 60 minutes ago with triage level "GREEN"
      And "Kari" is in consultation
      When "Kari" opens their queue view
      Then they see "You are being seen"

    Scenario: An open page shows it without reloading
      Given "Kari" arrived 60 minutes ago with triage level "GREEN"
      And "Kari" opens their queue view
      And they see position 1
      When "Kari" is called in
      And the page refreshes itself
      Then they see "You are being seen"

  Rule: The patient in the room counts as ahead of everyone waiting

    A waiting patient's estimate includes the patient in the room at that
    patient's level's average, because the estimate is everyone ahead of you and
    the room is ahead of you.

    @assumption
    Scenario: A waiting patient's estimate includes the patient in the room
      Given "Kari" arrived 60 minutes ago with triage level "GREEN"
      And "Ola" arrived 30 minutes ago with triage level "GREEN"
      And "Kari" is in consultation
      When "Ola" opens their queue view
      Then they see position 1
      And they see an estimated wait of 15 minutes
