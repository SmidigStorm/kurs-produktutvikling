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

> All quotes in 3.x and 5.x are from the same primary document: Helsedirektoratet, **"Legevakt og legevaktsentral — Nasjonal veileder"**, first published 2025-04-23, chapter 1 "Organisering av legevaktordningen". The PDF copy read carries an "Ekstern høring" banner with a consultation deadline of 16 July 2025 — see Knowledge Gap G1 on version status.
> [Helsedirektoratet veileder (PDF via Legeforeningen)](https://www.legeforeningen.no/contentassets/88f5bd06123648a8b06dc572103d8679/legevakt-og-legevaktsentral.pdf) — Accessed 2026-08-29. Reputation High (official).

**3.1 — Triage happens at least twice: once on the telephone, again on arrival.**
**Evidence (Norwegian verbatim, p.10)**: "Pasienter som får avtale om å møte på legevakten, bør alltid gis en hastegrad uavhengig av hvor stor pasientpågangen til legevakten er. Dersom første vurdering er gjort over telefon og pasienten ikke mottar hjelp umiddelbart, bør pasienten triageres på nytt etter ankomst til legevaktlokalet."
**Translation**: "Patients who are given an appointment to attend the legevakt should **always** be given a hastegrad (urgency grade), regardless of how large the patient load at the legevakt is. If the first assessment has been made over the telephone and the patient does not receive help immediately, the patient **should be triaged again after arrival** at the legevakt premises."
**Confidence**: High (authoritative national guideline, verbatim).
**Analysis**: The canonical Norwegian legevakt journey is: **phone call to legevaktsentral (triage 1, by an operator with bachelor-level health education) → travel → arrival (triage 2) → wait → doctor.** Walk-ins exist but the telephone is the designed front door — the national number is 116 117.

**3.2 — Re-triage of *waiting* patients is explicitly required, not an edge case.**
**Evidence (Norwegian verbatim, p.10)**: "Det er viktig å ha et system for å revurdere hastegrad hos ventende pasienter."
**Translation**: "It is important to have a system for **reassessing the urgency grade of waiting patients**."
**Confidence**: High.
**Analysis**: Our app's `TriageEvent` re-triage history is therefore *more* faithful than we realised. Re-triage is national guidance, not a contrived teaching device.

**3.3 — Who triages: legevaktsentral operators are bachelor-level health personnel; the physical triage is by health personnel generally, not specified as "nurse".**
**Evidence**: akuttmedisinforskriften § 13 requires the legevaktsentral be "bemannes med personell med relevant helsefaglig utdanning på bachelornivå, nødvendig klinisk praksis og gjennomført tilleggsopplæring for arbeid som operatør". The veileder adds (p.6): "Ansatte i legevaktsentralen skal ha nødvendig opplæring, erfaring og kompetanse til kartlegge og vurdere pasientens helsetilstand, fastsette hastegrad, gi veiledning og medisinske råd og iverksette andre nødvendige tiltak."
For hospital emergency departments the parallel guidance says only "Det er helsepersonell som er ansvarlig for å innhente nødvendig informasjon for å kunne gjøre vurderingen."
**Sources**: [Lovdata, akuttmedisinforskriften § 13](https://lovdata.no/dokument/SF/forskrift/2015-03-20-231); Helsedirektoratet veileder p.6; [Helsedirektoratet, Somatiske akuttmottak — prioritering av pasienter](https://www.helsedirektoratet.no/retningslinjer/somatiske-akuttmottak/prioritering-av-pasienter/akuttmottakene-skal-ha-prosedyrer-for-prioritering-av-pasienter). All accessed 2026-08-29.
**Confidence**: High for the phone role; **Medium** for who does the in-person triage — in practice a nurse, but no national document I found *mandates* "sykepleier".

**3.4 — The tools differ by channel, and the guideline names them.**
**Evidence (Norwegian verbatim, p.9–10)**: "Det bør være tilgang på beslutningsstøtte og rådgivningsverktøy for triagering og vurdering, både via telefon og ved oppmøte på legevakten. Det finnes ulike systemer for triagering og vurdering av pasienter. Noen er utviklet spesielt for telefonvurdering, mens andre er utviklet for å brukes når pasienten er fysisk til stede."
"Det finnes to norskutviklede verktøy til bruk ved prioritering og hastegradsvurdering for vurdering av telefonhenvendelser: Norsk indeks for medisinsk nødhjelp (NIMN) og Legevaktindeks. NIMN brukes til å fastsette hastegrad og beslutte tiltak ved de mest tidskritiske henvendelsene og er i bruk ved alle AMK-sentralene i Norge."
"Et annet triagesystem er Manchester Triage System (MTS). MTS finnes både for oppmøte- og telefontriage (Telephone Triage and Advice, TTA), som kan gi en fordel ved at sammen system brukes både i legevaktsentralen og ved oppmøte i legevaktlokalet."
**Translation of the decisive sentence**: "NIMN is used to set the urgency grade and decide measures for the **most time-critical** enquiries and is in use at **all AMK centres** in Norway."
**Confidence**: High.
**This settles question 1 of the brief**: NIMN = AMK (the 113 emergency dispatch). Legevaktindeks = legevaktsentral (116 117 phone). MTS/RETTS/SATS = physical arrival triage. **RETTS is not named at all in the national legevakt guideline** — it is named in the quality indicator and is described elsewhere as used mostly in ambulance services and hospital paediatric emergency departments.

### 4. Is the two-stage nurse-then-doctor flow standard?

**4.1 — The clinicians are right that it is multi-stage, but the first stage is more often a *telephone* than a nurse in the building.**
**Evidence**: See 3.1 and 3.4. The designed flow is phone triage → arrival → re-triage → doctor. The veileder (p.11) also says: "Dersom førstevurdering er gjort over telefon, bør pasientmottaket eller resepsjonen være tilrettelagt slik at pasienten kan vurderes på nytt etter ankomst til legevaktlokalet. På den måten kan det fanges opp om pasientens tilstand har endret seg på en måte som får betydning for videre tiltak."
**Translation**: "If the first assessment has been made by telephone, the patient reception or the **reception desk** should be arranged so that the patient can be assessed again after arrival. In this way it can be captured whether the patient's condition has changed in a way that has significance for further measures."
**Analysis (interpretation)**: The second triage is located at **reception**, not necessarily in a consultation room. So "wait for a nurse, then wait for a doctor" is a real pattern, but the national guidance frames the arrival assessment as a short desk-side reassessment rather than a full consultation slot. Both patterns exist; large legevakter with a triage nurse in a room match the clinicians' description.
**Confidence**: Medium — the guideline describes arrangement and intent, not a mandated two-queue process model.

**4.2 — Not every patient goes through the doctor: some are advised and sent home, some are referred to the fastlege.**
**Evidence (Norwegian verbatim, p.10)**: Legevaktindeks "støtter håndtering av den første kontakten med pasientene ved å strukturere samtalen via forslag til viktige spørsmål, råd om når pasienten bør tilses av lege, når det kan henvises til fastlege, og konkrete medisinske råd i tilfeller der pasienten ikke trenger legetilsyn."
**Translation**: "...advice on when the patient should be seen by a doctor, when they can be referred to the GP, and concrete medical advice in cases where the patient **does not need to be seen by a doctor**."
**Confidence**: High.
**Analysis**: There is a real "exit before the doctor" path. This validates the app's cycle-2 feature (patient leaves without being seen) as domain-plausible, though the domain reason is usually *dispositional*, not abandonment.

**4.3 — There is a documented bypass for the most urgent: "fast track" past the legevakt entirely.**
**Evidence (Norwegian verbatim, p.14)**: among factors in deciding whether to turn out: "Sannsynlig tilstand der pasienten skal eller kan fraktes til sykehus uten nærmere involvering av legevakten («fast track»)."
**Translation**: "Probable condition where the patient shall or can be transported to hospital **without further involvement of the legevakt** ('fast track')."
**Confidence**: High.
**Analysis**: Answers the practitioners' open question "can a patient skip the nurse entirely?" — the true red-patient path frequently skips the *legevakt* entirely and goes to hospital by ambulance. A red patient sitting in a legevakt waiting room with a queue position is close to a category error.

**4.4 — Further stages: laboratory yes, imaging generally no.**
**Evidence (Norwegian verbatim, p.17)**: "På legevakt er den akutte diagnostikken i sentrum. Legevakt bør tilby analyser som relativt enkelt kan etableres og som understøtter den kliniske beslutningen i en legevaktkonsultasjon." Guidance on equipment (p.16) explicitly lists as a planning factor "Avstand og reisetid til nærmeste sykehus/poliklinikk med røntgen for diagnose og behandling av bruddskader".
**Translation**: "At the legevakt, acute diagnostics is central. The legevakt should offer analyses that can be relatively simply established and that support the clinical decision in a legevakt consultation." / "Distance and travel time to the nearest hospital/outpatient clinic **with X-ray**..."
**Confidence**: High.
**Analysis**: Point-of-care lab is in-house and is a real intra-visit stage. Imaging is often *not* on site — it is a referral out, not a queue stage. So "lab, X-ray, observation" is not a uniform set of extra stages.

### 5. Regulatory basis (akuttmedisinforskriften, Helsedirektoratet)

**5.1 — The municipality's duty, verbatim.**
**Evidence (Norwegian verbatim, akuttmedisinforskriften § 6)**: "Kommunen skal tilby legevaktordning som sikrer befolkningens behov for øyeblikkelig hjelp, og må sørge for at minst en lege er tilgjengelig for legevakt hele døgnet."
**Translation**: "The municipality shall offer a legevakt arrangement that secures the population's need for immediate help, and must ensure that **at least one doctor** is available for legevakt around the clock."
**Source**: [Lovdata, Forskrift om krav til og organisering av kommunal legevaktordning ... (akuttmedisinforskriften), FOR-2015-03-20-231](https://lovdata.no/dokument/SF/forskrift/2015-03-20-231) — Accessed 2026-08-29. Reputation High (authoritative legal text).
**Confidence**: High.
**Analysis**: The regulatory floor is literally *one* doctor. Note this cuts **against** the clinicians' critique in one narrow respect — see the "how wrong are we" section.

**5.2 — THE ONLY TIME LIMIT IN THE REGULATION IS A TELEPHONE ANSWER TIME. It is two minutes, not thirty.**
**Evidence (Norwegian verbatim, akuttmedisinforskriften § 13 bokstav d, restated in the veileder p.5 and p.6)**: "innrette systemet for mottak av telefonhenvendelser slik at 80 prosent av alle henvendelser normalt kan besvares innen to minutter"
**Translation**: "arrange the system for receiving telephone enquiries such that **80 percent of all enquiries can normally be answered within two minutes**."
And the veileder's gloss (p.6): "Akuttmedisinforskriften § 13 bokstav d setter krav til at legevaktsentralen skal innrette systemet for mottak av telefonhenvendelser slik at 80 prosent av alle henvendelser kan besvares normalt innen to minutter. Dette er en nasjonal kvalitetsindikator, som Helsedirektoratet presenterer."
**Sources**: Lovdata § 13 d; Helsedirektoratet veileder p.5–6; [Helsedirektoratet kvalitetsindikator "Svartid legevakt 116 117"](https://www.helsedirektoratet.no/statistikk/kvalitetsindikatorer/akuttmedisinske-tjenester-utenfor-sykehus/svartid-legevakt-116-117). All accessed 2026-08-29.
**Confidence**: High (three independent official sources: the regulation, the guideline, the indicator).
**Analysis**: This is a **percentile service-level target on a telephone queue**, not a per-patient deadline in the waiting room. It is the only legally binding number about waiting anywhere in Norwegian legevakt regulation that I could find.

**5.3 — There is NO regulated maximum waiting time at a legevakt.**
**Evidence**: Searched akuttmedisinforskriften in full; the national veileder chapter 1; the national quality indicator set for legevakt; and the Helsedirektoratet guideline for somatic emergency departments. None states a maximum time to assessment or treatment. The akuttmottak guidance explicitly "does not specify any maximum time for doctor assessment" and requires only that procedures "sikre at pasienter får nødvendig helsehjelp i tide" ("ensure patients receive necessary healthcare in time").
**Confidence**: High (negative finding, established across four official sources).
**This is a load-bearing negative finding.** Time targets in Norwegian legevakt come from the *chosen triage system* (a vendor/clinical instrument), never from the state.

**5.4 — Legal basis cited for the triage recommendation.**
**Evidence (Norwegian verbatim, p.10 "Rettslig grunnlag")**: akuttmedisinforskriften § 13 c; helse- og omsorgstjenesteloven § 4-1 første ledd; helsepersonelloven §§ 4 og 16; forskrift om ledelse og kvalitetsforbedring i helse- og omsorgstjenesten.
And § 13 c itself requires the legevaktsentral to "veilede og gi råd samt prioritere og registrere henvendelser om øyeblikkelig hjelp".
**Translation**: "...guide and give advice as well as **prioritise and register** enquiries about immediate help."
**Confidence**: High.
**Analysis**: "Prioritere og registrere" is the statutory hook for triage. Note it applies to the *legevaktsentral* (the phone), not the waiting room.

**5.5 — The 45-minute figure that does exist, and what it is actually about.**
**Evidence**: A national requirement discussed in the NKLM/Helsedirektoratet work on national legevakt requirements: 95% of the population and all urban centres in a legevakt district should be reachable by a legevakt doctor within 45 minutes of dispatch.
**Source**: [NKLM/Helsedirektoratet, "Nasjonale krav til legevakt og fremtidens øyeblikkelig hjelp-tilbud" (regjeringen.no)](https://www.regjeringen.no/contentassets/477c27aa89d645e09ece350eaf93fedf/no/sved/02.pdf) — Accessed 2026-08-29. Reputation High (ministry-hosted, NKLM-authored).
**Confidence**: Medium — obtained via search summary; direct PDF text extraction failed. See Knowledge Gap G2.
**Analysis**: This is an **outreach/travel** requirement (the doctor going to the patient), not a waiting-room requirement. It is about geography and coverage, not queues.

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
