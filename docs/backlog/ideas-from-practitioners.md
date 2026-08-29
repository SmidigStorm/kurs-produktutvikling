# Feature ideas from practitioners

Source: a nurse and a doctor, in the room, 2026-08-29.

Requirements input for the legevakt queue app. Recorded as given. Nothing here
is specified yet — these are requests, not acceptance criteria.

Open questions are the ones that change **how a feature must behave**. They were
asked because the people who can answer them were present.

---

## 1. The queue is not one queue

The real process has multiple stages. A patient first waits to see a **nurse**,
then waits again to see a **doctor**. The app models a single queue.

### Decided 2026-08-29 — what the patient sees

**One number at a time, inside a progress bar.**

The number is the patient's position in their **current** stage. The progress bar
shows the stages, so the patient understands the first wait is for the nurse and
that a second wait for the doctor follows.

Consequence for the spec: the same displayed number means different things at
different times — position among people waiting for a nurse, then position among
people waiting for a doctor. The progress bar is what makes that legible; without
it, a number that resets would read as the queue going backwards.

**Open questions:**

- Does the estimate cover the **current stage only**, or the total remaining time
  to being finished?
- What does the bar show while the patient is *with* the nurse — a third state,
  or the nurse stage held at complete?
- Is the doctor stage shown from the start as a known future step, or only once
  the nurse stage finishes?
- If the nurse sends the patient home, what does the bar do?
- Is the nurse appointment the triage assessment, or does triage happen before it
  (at the desk, on arrival)?
- Can a patient skip the nurse stage? Does a RED arrival go straight to a doctor?
- What orders the doctor queue — triage level again, or the order people finished
  with the nurse?
- Can the nurse change the triage level?
- Can a patient move backwards — doctor to nurse?
- Are there further stages: lab, imaging, observation?

**Shape:** structural. This changes the data model, not just a rule. Too large
for one cycle; would need splitting. The progress bar is the smallest piece that
could ship first.

---

## 2. Point patients to Helsedirektoratet guidance for their condition

A patient presenting with a particular diagnosis should be pointed to
Helsedirektoratet's page for that condition.

**Open questions:**

- Which conditions? A fixed list, or clinical judgement per patient?
- Who sets it and when — the nurse at assessment, or automatically from
  something recorded at check-in?
- A link out to helsedirektoratet.no, or content shown in the app?
- Is it guidance *while waiting*, or advice that means the patient leaves and
  does not wait? Those are different features.
- Is there a stable URL pattern per condition, or do we maintain a lookup?

**Shape:** first requirement that reaches outside the system. Also the first
carrying anything like clinical content, which the app has so far held none of.

---

## 3. Staffing drives the estimate

The estimate must account for **how many nurses and how many doctors are on
shift**. More clinicians working in parallel means everyone waits less.

The app currently assumes **one consultation room** — it sums the consultation
time of everyone ahead of you, sequentially. With three doctors working, every
number shown is roughly three times too high.

**Open questions:**

- Do nurses and doctors work fully in parallel, or does one gate the other?
- Does staffing change during a shift? Would the app need a roster, or just a
  current count someone enters?
- Are all clinicians interchangeable for queue purposes?

**Shape:** correction, not addition. The current formula is wrong.

---

## 4. Some presentations carry a deadline

Certain diagnoses arrive with a **time target** — "a deadline of for example 30
minutes".

Everything the app does today is *ordering*: who goes before whom. A deadline is
a **target that can be breached**, which introduces a breach state and something
that must be visible before it happens rather than after.

**Open questions:**

- Is the deadline attached to the triage level, or to the specific presentation?
- Time to *being seen*, or time to *treatment*?
- What happens on a breach — escalated, logged, reported?
- Does an approaching deadline re-order the queue automatically, or is it
  information for a human to act on?

**Shape:** a new kind of rule. Well sized for one cycle.

**Note:** research dispatched 2026-08-29 should establish whether this is a
published national target or local practice.

---

## 5. Show why you are in your colour

The patient should see a **legend explaining why** they have been given their
triage colour, not just the colour.

**Open questions:**

- The *general meaning* of the level ("green means stable, safe to wait"), or the
  *specific reason yours was assigned*?
- If specific: does the patient see their own recorded symptom back? That would
  be the first clinical content in the app.
- Is the legend the same for everyone at a level, or per patient?
- Does it appear on the patient view only, or the staff view too?

**Shape:** well sized for one cycle if the legend is per level. Larger if it is
per patient.

---

## Status

None are scheduled. The prepared course backlog (Plan C) is three features of a
deliberate shape; these are separate.

**Corrections (the model is wrong):** 1, 3
**Additions (the model is incomplete):** 2, 4, 5
