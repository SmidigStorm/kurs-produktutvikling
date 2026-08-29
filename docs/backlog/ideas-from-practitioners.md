# Feature ideas from practitioners

Source: a nurse and a doctor, in the room, 2026-08-29.

Recorded as they were given. Nothing here is specified yet — these are requests,
not acceptance criteria. Open questions are listed because the people who can
answer them were present; ask while you still have them.

---

## 1. The queue is not one queue

**What they said:** the real process has multiple stages. A patient first waits
to see a **nurse**, and then waits again to see a **doctor**. The app currently
models a single queue, which is not how a legevakt actually works.

**Why it matters:** a patient told "you are number 3" may be third for the
nurse and then face a second, longer wait they were never told about. The
current app is arguably *misleading* rather than merely incomplete.

**Open questions — ask them:**

- Is the nurse appointment *the* triage assessment, or does triage happen
  before it (at the desk, on arrival)?
- Can a patient skip the nurse entirely? A RED arrival presumably goes straight
  to a doctor — is that right?
- What orders the doctor queue: triage level again, or the order people finished
  with the nurse?
- Can the nurse change the triage level? (The app already records re-triage
  history, so this may already fit.)
- Can a patient be sent *back* — doctor to nurse, or nurse to home?
- Are there other stages we are missing — lab, X-ray, observation?
- **What should the patient see?** One number, two numbers, or a stage plus a
  number? This is the crux.

**Note for the course:** this is a large, structural change — it reshapes the
data model, not just a rule. It is bigger than a single cycle's feature. It
would need splitting, and *how to split it* is itself worth teaching.

It also collides productively with the planted ambiguity: with two queues,
"your position in the queue" becomes ambiguous in a second, independent way.

---

## 2. Send patients to Helsedirektoratet guidance for their condition

**What they said:** if a patient presents with a particular diagnosis, they
should be pointed to Helsedirektoratet's page for that condition.

**Recorded as reported — the details were not pinned down.** Do not build from
this without answering the questions below.

**Open questions — ask them:**

- Which conditions? Is there an existing list, or clinical judgement each time?
- Who decides and when — the nurse at assessment, or automatically from
  something recorded at check-in?
- Is it a **link out** to helsedirektoratet.no, or content shown inside the app?
- Is this guidance *while waiting*, or advice that means the patient can go home
  and not wait at all? Those are very different features.
- Does it replace anything currently shown, or sit alongside it?
- Is there a stable URL pattern per condition, or would we need a lookup we
  maintain ourselves?

**Note for the course:** this is the first request that reaches **outside the
system** — an external, third-party source of truth. That makes it a natural
candidate for teaching where an integration boundary belongs, and what happens
when the thing you depend on is not yours.

It is also the first feature carrying anything close to clinical content, which
runs against the app's standing rule of holding none. Worth deciding
deliberately whether a condition name counts.

---

## 3. Staffing drives the estimate

**What they said:** the estimate should account for **how many nurses and how
many doctors are on shift**. More clinicians working in parallel means everyone
waits less.

**Why it matters:** this is not a refinement, it is a correction. The app
currently assumes **one consultation room** — it adds up the consultation time of
everyone ahead of you, one after another. If three doctors are working, every
number the app shows is roughly three times too high. The current estimate is
not merely imprecise; it is wrong in a direction that makes waits look worse
than they are.

**Open questions — ask them:**

- Do nurses and doctors work fully in parallel, or does one gate the other?
- Does staffing change during an evening, and would the app need to know the
  roster, or just a current count someone types in?
- Are all clinicians interchangeable for queue purposes, or do some only see
  certain patients?

---

## 4. Some presentations carry a deadline

**What they said:** certain diagnoses arrive with a **time target** — "a deadline
of for example 30 minutes".

**Why it matters:** this is a kind of rule the app has no notion of. Everything
today is *ordering* — who goes before whom. A deadline is a **target that can be
breached**, which introduces time pressure, a breach state, and presumably
something that has to be visible to staff before it happens rather than after.

**Open questions — ask them:**

- Is the deadline attached to the triage level, or to the specific presentation?
- Is it time to *being seen*, or time to *treatment*?
- What happens on a breach — is it escalated, logged, reported?
- Does an approaching deadline re-order the queue automatically, or is it
  information for a human to act on?

**Note:** the research dispatched on 2026-08-29 should establish whether this is
a published national target rather than local practice.

---

## 5. Show why you are in your colour

**What they said:** the patient should see a **legend explaining why** they have
been given their triage colour — not just the colour itself.

**Why it matters:** the app currently shows `GREEN` and nothing else. A colour
with no explanation is an unexplained verdict, and the patient most likely to
be upset by it — the one waiting longest — is the one given least reason.

**Open questions — ask them:**

- Is this the *general meaning* of the level ("green means your condition is
  stable and safe to wait"), or the *specific reason yours was assigned*?
- If specific: does the patient see their own recorded symptom back? That would
  be the first clinical content in the app, which the design has so far avoided
  entirely.
- **Does explaining help or harm?** A patient who understands why they are
  waiting may be calmer — or may argue with the assessment. You two will know
  which happens in practice, and it decides whether this feature is a good idea.
- Would it change what staff are willing to record, knowing the patient sees it?

---

## Status

None of these are scheduled. The prepared course backlog (Plan C) is three
features of a deliberate shape; these are separate.

Two of them are **corrections rather than additions** — item 1 (the queue is not
one queue) and item 3 (staffing drives the estimate) say the current model is
wrong, not incomplete. That distinction matters when deciding what to do with
them: a teaching app may keep a simplified model deliberately, but it should
know it is simplified and say so, rather than quietly misinform a clinician
looking over a student's shoulder.

Items 4 and 5 are additions, and both are well-sized for a course cycle.
