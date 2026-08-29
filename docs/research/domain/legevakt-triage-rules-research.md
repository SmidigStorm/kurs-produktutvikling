# Research: The rules of Norwegian legevakt triage — systems, levels, time targets, staffing and patient communication

**Date**: 2026-08-29 | **Researcher**: nw-researcher (Nova) | **Confidence**: _pending_ | **Sources**: _pending_

> Purpose: make the teaching queue app credible to clinicians. Not a clinical system.

## Executive Summary
_To be written last._

## Research Methodology
_To be completed._

## Findings

### 1. Which triage systems are actually used in Norwegian legevakt

**1.1 — There is no single national triage system. Several coexist.**
**Evidence**: Helsedirektoratet's national quality indicator "Triagering ved legevakt" names as standardised tools: RETTS, METTS, MTS (Manchester Triage System), SATS (South African Triage Scale), NEWS2, PEVS.
**Source**: [Helsedirektoratet, Nasjonale kvalitetsindikatorer for legevakt — Triagering ved legevakt](https://www.helsedirektoratet.no/rapporter/nasjonale-kvalitetsindikatorer-for-legevakt/triagering-ved-legevakt) — Accessed 2026-08-29. Reputation High (official).
**Confidence**: High.

**1.2 — Coverage is far from universal: ~73% of relevant legevakter use a standardised tool.**
**Evidence**: "Among clinics where triage is relevant, 73% report having a standardized triage tool (down from 77% in 2022). 19% of all legevakter reported triage as not applicable due to infrequent simultaneous patient conflicts."
**Source**: Helsedirektoratet kvalitetsindikator (as above) — Accessed 2026-08-29.
**Analysis (interpretation)**: Many small legevakter have so little simultaneity that formal triage is moot — one patient, one doctor. This matters for the app: the *queue* is itself a big-legevakt phenomenon.
**Confidence**: High (single authoritative official source).

**1.3 — Definition of triage used officially.**
**Evidence (Norwegian original)**: "Med triage menes å bestemme prioriteringsrekkefølgen av pasienter basert på grad av alvorlighet og hastegraden av deres medisinske tilstand."
**Translation**: "By triage is meant determining the order of priority of patients based on the degree of severity and the urgency (hastegrad) of their medical condition."
**Source**: Helsedirektoratet kvalitetsindikator (as above) — Accessed 2026-08-29.
**Confidence**: High.
**Analysis**: Note the official definition is about **ordering**, not about time targets. Time targets come from the individual systems, not from national policy.

**1.4 — National guideline requires *a* system, without prescribing which.**
**Evidence**: Recommendation title: "Legevakt og legevaktsentral bør ha et system for prioritering og triagering av pasienter" ("Legevakt and legevaktsentral *should* have a system for prioritisation and triage of patients") — note "bør" (should), not "skal" (shall).
**Source**: [Helsedirektoratet, Nasjonal veileder: Legevakt og legevaktsentral](https://www.helsedirektoratet.no/veiledere/legevakt-og-legevaktsentral) (first published 2025-04-23) — Accessed 2026-08-29. Reputation High (official).
**Confidence**: High.

### 2. Level vocabulary and time targets

**2.1 — RETTS five levels and maximum time to physician assessment.**
**Evidence**: Red — physician assessment immediately; Orange — maximum 20 minutes; Yellow — up to 120 minutes; Green — up to 240 minutes; Blue — no urgency.
**Source**: [Helsebiblioteket / Norsk barnelegeforening, Akuttveileder i pediatri 1.13 "Pediatrisk tidlig varslingsskår, triage og kommunikasjon"](https://www.helsebiblioteket.no/innhold/retningslinjer/pediatri/akuttveileder-i-pediatri/1.akutte-prosedyrer-og-tilstander-inkludert-ulykker/1.14-pediatrisk-tidlig-varslingsskar-triage-og-kommunikasjon) — Accessed 2026-08-29. Reputation High (official/professional guideline).
**Evidence (Norwegian verbatim)**: "rød, umiddelbar legevurdering; oransje, inntil 20 minutters ventetid; gul, inntil 120 min; grønn, inntil 240 min; og blå, ikke hast."
**Translation**: "red, immediate physician assessment; orange, up to 20 minutes' waiting time; yellow, up to 120 min; green, up to 240 min; and blue, not urgent."
**Verification**: Same figures returned independently via search summary of RETTS materials (NAKOS ambulance RETTS documentation).
**Confidence**: Medium-High (one authoritative professional guideline, verbatim; RETTS is a licensed vendor system so the vendor definition governs).

**2.2 — SATS Norge five levels, with times stated explicitly for legevakt.**
**Evidence**: SATS Norge uses RØD, ORANSJE, GUL, GRØNN, BLÅ with times to doctor consultation of 0, 10, 60, 120 and 120 minutes respectively; these times are described as time to doctor for patients "at a legevakt or emergency department".
**Source**: [Helse Bergen, SATS Norge 4.0 — praktisk guide for legevakt, ambulanse og akuttmottak](https://www.helse-bergen.no/4a461e/siteassets/seksjon/mottaksklinikken/documents/2020.09.01-praktisk-guide-til-sats-norge-4.0_-a5-format.pdf) — Accessed 2026-08-29. Reputation High (health trust, official).
**Analysis**: SATS Norge is the one system whose published guide is explicitly titled "for legevakt". Developed in Helse Vest.
**Confidence**: Medium — figures from search summary of the PDF; PDF text extraction failed on direct fetch. _[verbatim quote not obtained — see Knowledge Gaps]_

**2.3 — The three systems disagree on times. This is the single most important finding for the app.**
| System | Rød | Oransje | Gul | Grønn | Blå |
|---|---|---|---|---|---|
| RETTS | immediately | 20 min | 120 min | 240 min | not urgent |
| SATS Norge | 0 min | 10 min | 60 min | 120 min | 120 min |
| MTS (Manchester) | 0 min | 10 min | 60 min | 120 min | 240 min |
**Analysis (interpretation)**: There is no national Norwegian time standard. A patient with the same colour has a different promised maximum wait depending on which legevakt they walk into.

**2.4 — Norsk indeks for medisinsk nødhjelp (NIMN) is a *different kind of thing*: phone triage, three haste grades, no colour-with-minutes scale.**
**Evidence**: NIMN was developed by anaesthetists and GPs on the initiative of Den norske legeforening in 1994. Operators categorise enquiries into one of three hastegrader: **akutt, haster, vanlig** — also referred to as **rød, gul, grønn respons**.
- **Rød respons (akutt)**: life-threatening or potentially life-threatening; an acute time-critical condition.
- **Gul respons (haster)**: possibly serious condition where vital organs may be threatened and there is need for rapid situational assessment by a doctor.
- **Grønn respons (vanlig)**: conditions that are not more urgent than that they can wait until the first suitable opportunity ("første passende anledning").
**Source**: [Den norske legeforening, Norsk indeks for medisinsk nødhjelp (hosted by Sykehuset Telemark)](https://www.sthf.no/4a8185/siteassets/dokumenter-felles/rapporter-og-planverk/ambulanseplan/03-den-norske-legeforeningen-norsk-indeks-for-medisinsk-nodhjelp.pdf) — Accessed 2026-08-29. Reputation High (professional body + health trust).
**Analysis (interpretation)**: NIMN is a **dispatch** tool (AMK / legevaktsentral, over the telephone), deciding *what resource to send and how fast*. It is **not** a waiting-room triage scale and carries **no minutes-to-assessment**. Its "grønn" is defined by "first suitable opportunity", which is deliberately not a number.

**2.5 — Legevaktindeks: the legevakt-specific decision support, four codes, no minutes.**
**Evidence (Norwegian verbatim)**: "Legevaktindeks er en videreutvikling av beslutningsstøtteverktøyet Telefonråd, og er laget spesielt for håndtering av pasienthenvendelser ved legevakter og allmennlegekontor."
**Translation**: "Legevaktindeks is a further development of the decision-support tool Telefonråd, and is made specifically for handling patient enquiries at legevakter and general practice offices."
Codes: **A (Akutt)** red criteria, **H (Haster)** yellow, **V (Vanlig)** green requiring physician evaluation, **R (Råd)** green, self-care advice. "Legevaktindeks er tett integrert med Norsk indeks for medisinsk nødhjelp (NIMN) versjon 5.1."
**Publisher**: Nasjonalt kompetansesenter for legevaktmedisin (NKLM) holds editorial and clinical responsibility.
**Source**: [Legevaktindeks — Om Legevaktindeks](https://legevaktindeks.no/om-legevaktindeks/) — Accessed 2026-08-29. Reputation High (NKLM, the national centre for emergency primary care medicine).
**Confidence**: High.
**Note**: "The document contains no defined response times in minutes."

**2.6 — Answer to the question "how do haste grades relate to the colour scale?"**
**Analysis (interpretation, clearly labelled)**: They are parallel but **not** the same axis, and conflating them is a real error:
- **Akutt / Haster / Vanlig (+ Råd)** = *telephone* prioritisation, 3–4 categories, decides response and resource. Owned by NIMN / Legevaktindeks.
- **Rød / Oransje / Gul / Grønn / Blå** = *in-person* triage on arrival, 5 categories, each with a maximum minutes-to-doctor. Owned by RETTS / MTS / SATS Norge.
The two scales share the words red/yellow/green, which is exactly why they get confused. NIMN's red/yellow/green are three *response* colours; RETTS's five are *waiting* colours.

### 3. Who triages, and when
_pending_

### 4. Is the two-stage nurse-then-doctor flow standard?
_pending_

### 5. Regulatory basis (akuttmedisinforskriften, Helsedirektoratet)
_pending_

### 6. Waiting-time communication to patients
_pending_

### 7. Staffing and wait estimation
_pending_

## Triage level table (deliverable)
_pending_

## How wrong our current model is
_pending_

## Recommendation for the teaching app
_pending_

## Source Analysis
_pending_

## Knowledge Gaps
_pending_

## Conflicting Information
_pending_

## Full Citations
_pending_

## Research Metadata
_pending_
