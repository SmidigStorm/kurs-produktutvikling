@LEGE-10
Feature: Consultation room

  Staff see who is in the consultation room above the queue, and the patient
  in the room sees that they are being seen.

  # LEGE-10. The same rules and examples are in the work item. Change both.

  Background:
    Given the clinic queue is empty

  Rule: The patient in consultation is shown above the queue, with name and level

    One line, always in the same place above the waiting rows: "Consultation room:
    Kari Nordmann, GREEN" when someone is in, "Consultation room: free" when nobody
    is. One room.

    Scenario: The patient in the room is shown above the waiting queue
      Given "Kari" arrived 60 minutes ago with triage level "GREEN"
      And "Ola" arrived 30 minutes ago with triage level "GREEN"
      And "Kari" is in consultation
      When staff open the queue
      Then "Kari" is shown in consultation
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

    Scenario: The patient in the room sees they are being seen
      Given "Kari" arrived 60 minutes ago with triage level "GREEN"
      And "Kari" is in consultation
      When "Kari" opens their queue view
      Then they see "You are being seen"
