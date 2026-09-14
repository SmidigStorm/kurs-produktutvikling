# Tasks for LEGE-10

- [x] **1. Update contract/src/index.ts: queueResponseSchema gains inConsultation**
  - Does: a `roomOccupantSchema` of `id`, `patientName`, `level`, and `inConsultation:
    roomOccupantSchema.nullable()` on `queueResponseSchema`, with the inferred `RoomOccupant` type
    exported. The backend and the frontend both read it from here
  - Serves: `The patient in the room is shown above the waiting queue`, `An empty room says so`
  - Prove: `npm run typecheck`

- [x] **2. Update backend/src/domain/queue.test.ts: the estimate counts the occupant, roomIsFree**
  - Does: `estimatedWaitMinutes` with a GREEN occupant adds 15 to everyone's estimate and gives
    the front patient 15, not 0; without an occupant the existing numbers are unchanged.
    `roomIsFree` is true for no visits, true when the only in-room patient is DONE, false when
    one visit is IN_CONSULTATION. Written first, red until task 3
  - Serves: `A waiting patient's estimate includes the patient in the room`
  - Prove: `npx vitest run backend/src/domain/queue.test.ts`, red

- [x] **3. Update backend/src/domain/queue.ts: estimatedWaitMinutes takes an occupant, roomIsFree**
  - Does: `estimatedWaitMinutes(visits, visitId, occupant?: { level: TriageLevel })` adds
    `AVERAGE_CONSULTATION_MINUTES[occupant.level]` to the sum when an occupant is given.
    `roomIsFree(visits: { status: VisitStatus }[])` returns true when none is `IN_CONSULTATION`.
    Pure, no clock, no database. Needs 2
  - Serves: `A waiting patient's estimate includes the patient in the room`
  - Prove: `npx vitest run backend/src/domain/queue.test.ts`, green

- [x] **4. Update backend/src/api/app.test.ts: inConsultation in the queue, the estimate, the 409**
  - Does: `/api/queue` returns `inConsultation: null` for a waiting-only queue and the occupant's
    id, name and level when one visit is IN_CONSULTATION; a waiting patient's
    `estimatedWaitMinutes` from `/api/visits/:id` includes the occupant's average; `POST
    /api/visits/:id/status` with IN_CONSULTATION answers 409 while another visit is in the room,
    and 200 for the same visit again. Written first, red until task 5
  - Serves: `The patient in the room is shown above the waiting queue`, `An empty room says so`,
    `A waiting patient's estimate includes the patient in the room`
  - Prove: `npx vitest run backend/src/api/app.test.ts`, red

- [x] **5. Update backend/src/api/app.ts: the occupant in both reads, 409 on a taken room**
  - Does: a `roomOccupant(db)` helper selecting the visit with status IN_CONSULTATION, if any.
    `/api/queue` passes it to `estimatedWaitMinutes` for every entry and returns it as
    `inConsultation`. `/api/visits/:id` passes it too. The status route, when the new status is
    IN_CONSULTATION and `roomIsFree` is false for visits other than this one, answers 409
    `{ error: 'room is taken' }`. Needs 1, 3, 4
  - Serves: `The patient in the room is shown above the waiting queue`, `An empty room says so`,
    `A waiting patient's estimate includes the patient in the room`
  - Prove: `npx vitest run backend/src/api/app.test.ts`, green, and `npm test`

- [x] **6. Create step "{string} is in consultation" in e2e/steps/queue.steps.ts**
  - Does: posts `{ status: 'IN_CONSULTATION' }` to `/api/visits/<id>/status` for the visit id
    registered under that name. One definition with two phrasings: `{string} is in consultation`
    and `{string} is called in`, so it reads as Given and as When
  - Serves: every scenario of the item except `An empty room says so`
  - Prove: `npx bddgen` lists no missing step for either phrasing

- [x] **7. Create step "they see {string}" in e2e/steps/queue.steps.ts**
  - Does: `await expect(page.getByRole('main')).toContainText(text)`, next to the other patient
    page assertions
  - Serves: `The patient in the room sees they are being seen`,
    `An open page shows it without reloading`
  - Prove: `npm run test:e2e -- --grep "The patient in the room sees they are being seen"`, red
    until task 10

- [x] **8. Create steps "the consultation room shows {string}, {string}" and "the consultation room is shown as free" in e2e/steps/staff.steps.ts**
  - Does: both assert on `page.getByRole('status', { name: 'Consultation room' })`: the first
    `toContainText` of the name and of the level, the second `toHaveText('Consultation room: free')`
  - Serves: `The patient in the room is shown above the waiting queue`, `An empty room says so`,
    `Marking the patient in the room done frees the room`
  - Prove: `npm run test:e2e -- --grep "An empty room says so"`, red until task 9

- [ ] **9. Update frontend/src/StaffView.tsx: the consultation room line above the table**
  - Does: keep `inConsultation` from the queue response in state beside `entries`. Above the
    table, `<p role="status" aria-label="Consultation room">` reading "Consultation room: free",
    or "Consultation room: Kari, GREEN" with the level as a chip and a Done button
    `aria-label="Mark Kari done"` that posts DONE and reloads. The header count stays about
    waiting patients. Needs 1, 5, 8
  - Serves: `The patient in the room is shown above the waiting queue`, `An empty room says so`,
    `Marking the patient in the room done frees the room`
  - Prove: `npm run test:e2e -- --grep "Consultation room"` for the three staff scenarios, green

- [ ] **10. Update frontend/src/PatientView.tsx: "You are being seen" replaces position and wait**
  - Does: when `visit.status === 'IN_CONSULTATION'`, render `<p role="status" aria-label="Being
    seen">You are being seen</p>` in place of the position and estimated-wait blocks; branch on
    status, never on a null position. The level chip and the explanation stay. Needs 7
  - Serves: `The patient in the room sees they are being seen`,
    `An open page shows it without reloading`
  - Prove: `npm run test:e2e -- --grep "@LEGE-10\b"`, all seven green, then `npm run test:e2e`

No documentation task: the README describes how the queue is ordered and estimated, and the
estimate rule it states ("every patient ahead of you") still holds with the room counted as ahead.
