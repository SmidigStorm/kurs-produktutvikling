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

## Status

Neither is scheduled. The prepared course backlog (Plan C) is three features of
a deliberate shape; these are separate, and larger. Decide whether they become
course material, a stretch exercise, or simply a record that the domain is
richer than the teaching model.
