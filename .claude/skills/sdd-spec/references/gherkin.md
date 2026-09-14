<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Writing the scenarios

The feature file is the acceptance criteria. Nothing else is.

## Shape

```gherkin
@LEGE-3
Feature: Urgent arrivals

  Patients see their place change when someone more urgent arrives.

  # LEGE-3. The same rules and examples are in the work item. Change both.

  Background:
    Given the clinic queue is empty

  Rule: A more urgent patient is seen first

    Scenario: A red arrival moves ahead of a green patient
      Given "Kari" arrived 60 minutes ago with triage level "GREEN"
      And "Maja" arrived 5 minutes ago with triage level "RED"
      When "Kari" opens their queue view
      Then they see position 2
```

- **One feature file per item.** `Feature:` is the item's title. The ID tag (`@LEGE-3`) sits above
  `Feature:` so every scenario inherits it. That tag is how `sdd-tasks` and `sdd-implement` find
  the item's scenarios.
- **`Rule:` = a rule from the item. `Scenario:` = one of its examples.** Same names, same order.
- **`Background:`** only for `Given` steps that open every scenario in the file.
- **`@assumption`** above a scenario that rests on a guess (see sdd-spec § "Make up the rest").

## Conventions

| Do | Not |
|---|---|
| **Reuse the repo's phrasing.** Read the other feature files first and say things the way they do | A step one word different from an existing one, for no new behaviour |
| **An unhappy path per rule** where one exists: refused, empty, too late. Something happens and a person sees it | Only the happy path |
| **Concrete values:** "Kari", "60 minutes ago", "GREEN" | "a patient with a low priority" |
| **Declarative:** what happens, in the domain's words | Buttons, fields, URLs, CSS: "clicks the Save button" |
| **One `When` per scenario:** one behaviour | Two actions, or "if X then Y, otherwise Z" |
| **An observable `Then`:** something a person could check | "Then the system handles it correctly" |
| **Titles say the outcome:** "A red arrival moves ahead of a green patient" | Titles naming code: "QueueService.sort handles RED" |

**The empty case.** Anything list-shaped needs a scenario for when the list is empty.

**Unhappy path, not negative scenario.** An unhappy path has an outcome a person can check:
the arrival is refused and staff see "Enter the patient's name"; the patient marked done sees
"You have been seen". A negative scenario only asserts that something is absent, "Then staff do
not see the explanation", which also passes on a blank page. Never write those. Say the rule in
prose instead, as "Staff do not see it".

Keep it small. The smallest set of rules that makes the request testable, and one or two examples
each, beats twelve rules nobody reads.
