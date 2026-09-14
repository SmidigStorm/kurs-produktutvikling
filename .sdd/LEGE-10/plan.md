# Plan for LEGE-10

## Approach
The consultation room becomes part of the queue domain. The estimate function takes an optional
occupant and counts their level's average as time ahead of every waiting patient, and a pure rule
says whether the room is free. Both live in `backend/src/domain/queue.ts` next to the ordering
rule, tested the same way. The queue response carries the occupant, the status endpoint refuses a
second occupant with 409, and the two views render what the API gives them: a room line above the
staff table with a Done button named like the rows' buttons, and "You are being seen" in place of
position and wait on the patient page.

Rejected: handling the room inside the API route. Two fewer files, but the "room counts as ahead"
rule would live in a handler instead of the domain module the README points every queue rule to.

## Files
| File | Change |
|---|---|
| contract/src/index.ts | changed: `queueResponseSchema` gains `inConsultation`, an object of `id`, `patientName`, `level`, or `null` |
| backend/src/domain/queue.ts | changed: `estimatedWaitMinutes(visits, visitId, occupant?)` adds `AVERAGE_CONSULTATION_MINUTES[occupant.level]`; new `roomIsFree(visits)` true when no visit has status `IN_CONSULTATION` |
| backend/src/domain/queue.test.ts | changed: the estimate with and without an occupant, the old numbers unchanged without one; `roomIsFree` for an empty room, a taken room, a room whose patient is done |
| backend/src/api/app.ts | changed: `/api/queue` and `/api/visits/:id` look up the occupant and pass it to the estimate; `/api/queue` returns `inConsultation`; `POST /api/visits/:id/status` answers 409 `room is taken` when the status is `IN_CONSULTATION` and another visit already has it |
| backend/src/api/app.test.ts | changed: `inConsultation` in the queue response, null when empty; a waiting patient's estimate includes the occupant; the 409; the same patient may be set to `IN_CONSULTATION` again without a 409 |
| frontend/src/StaffView.tsx | changed: a `role="status"` line with the accessible name "Consultation room" above the table, "Consultation room: free" or "Consultation room: Kari, GREEN" with a Done button labelled "Mark Kari done"; the counter in the header stays about waiting patients |
| frontend/src/PatientView.tsx | changed: when `visit.status` is `IN_CONSULTATION`, a `role="status"` line "You are being seen" replaces the position and estimated wait blocks |
| e2e/steps/queue.steps.ts | changed: `{string} is in consultation`, usable as Given and as When ("is called in" is a second phrasing of the same definition), posting the status through the API; `they see {string}`, asserting on the page's main region |
| e2e/steps/staff.steps.ts | changed: `the consultation room shows {string}, {string}` and `the consultation room is shown as free`, both asserting on the "Consultation room" status region |

## Risks
- The existing "Marking a patient done removes them from the queue" scenario relies on the button
  name "Mark Kari done" being unique on the page. The room's button uses the same naming, and a
  patient is never both in the room and in the table, so it stays unique. If a later change lets
  the same name appear twice, that scenario and the new one both go red, which is the guard
  working.
- `they see {string}` is broad. It asserts on the main region so that it cannot be satisfied by
  text in the header. Keep it for short, distinctive strings.
- `/api/visits/:id` returns `position: null` for a patient in consultation today. The patient view
  must branch on `status`, not on `position`, or a done patient would also read "being seen".

Approved: 2026-09-14
