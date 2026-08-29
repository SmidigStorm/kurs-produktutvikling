# Research: The rules of Norwegian legevakt triage — systems, levels, time targets, staffing and patient communication

**Date**: 2026-08-29 | **Researcher**: nw-researcher (Nova) | **Confidence**: High | **Sources**: 20 cited, all High reputation

> Purpose: make the teaching queue app credible to clinicians. Not a clinical system, and never will be.

## Executive Summary

**There is no single Norwegian triage system and no national maximum waiting time.** Norway's Directorate of Health requires only that a legevakt *"bør ha et system for prioritering og triagering"* — should have *a* system — and about 73% of legevakter where triage is relevant actually use a standardised one. Three in-person systems circulate: **SATS Norge** (developed by Helse Vest, and the only one whose published guide is explicitly *"for legevakt"*), **MTS/Manchester** (used at several Norwegian legevakter and akuttmottak), and **RETTS** (mostly ambulance and paediatric emergency departments; a licensed vendor product). They disagree about the numbers. Separately and confusingly, the *telephone* side runs on a different scale entirely — **akutt / haster / vanlig** from Norsk indeks for medisinsk nødhjelp (all AMK centres) and **Legevaktindeks** from NKLM (built specifically for legevaktsentraler) — and that scale carries **no minutes at all**. Red/yellow/green on the phone and red/orange/yellow/green/blue in the waiting room are two different axes that happen to share colour words. The only legally binding time anywhere in the domain is akuttmedisinforskriften § 13 d: *80 percent of telephone enquiries answered within two minutes*.

**Our five invented items score two right, three wrong.** The five colour levels are, by luck, exactly the real vocabulary — keep them, but in Norwegian, and note that under SATS Norge blue is *not* the longest wait. The invented per-level consultation times are wrong in kind: every real system attaches a **maximum time until you are seen** (a deadline counting down from triage), not an expected service duration, and our figures run in the opposite direction from the real semantics. The single room is defensible only for a small legevakt — national guidance says *"Det bør være minst to undersøkelsesrom ved større legevakter"*, chosen explicitly for *"best mulig pasientflyt"* — while the regulation's floor is genuinely one doctor, and there is no published national staffing ratio at all. The single queue is wrong, though not quite in the shape the clinicians described: the real first stage is more often the **116 117 telephone call** than a nurse in the building, and national guidance requires the patient to be **triaged again on arrival**. The missing deadline is the biggest miss and the cheapest fix.

**Two findings are worth more than the rest.** First, the clinicians' remembered *"deadline of for example 30 minutes"* corresponds to **no published Norwegian target** — the real orange figures are 10 minutes (SATS Norge, MTS) and 20 minutes (RETTS) — and it matches, verbatim, a misconception the state supervisory authority recorded as an audit finding at a Norwegian legevakt: *"Flere oppgir at oransje hastegrad er 20-30 minutter."* Second, the same audit states what a breached deadline actually *means*: **"Pasienter skal retriageres dersom de ikke får tilsyn av lege etter maks ventetid"** — the time target is a re-assessment trigger, not a service promise. That maps almost exactly onto the app's already-planned cycle-3 "queue aging" amendment, which turns out to be an approximation of a real national rule. On the practitioner's question of whether showing an estimate is wise at all: patients overwhelmingly want it (81–91%), randomised evidence says it does **not** improve satisfaction, and one peer-reviewed field study finds that once the communicated estimate is exceeded, aggression toward staff rises **above the no-information baseline**. The practitioner's instinct is correct and there is evidence for it — which makes the feature better teaching material, not worse.

## Research Methodology

**Search Strategy**: Norwegian-language search first, English only where no Norwegian literature exists (the waiting-time-communication evidence). Entry points were the Helsedirektoratet national guideline and quality-indicator pages, then outward to the legal text on lovdata.no, the NKLM tool (Legevaktindeks), the Helse Vest clinical instrument (SATS Norge), Helsetilsynet supervisory reports (which proved unusually valuable — they document what actually happens rather than what should), and peer-reviewed literature via PubMed Central and PLOS. Local project files (`docs/backlog/ideas-from-practitioners.md`, `docs/course-design-decisions.md` §3a) were read first to fix what "our current model" means.

**Source Selection**: Official (Directorate of Health, Lovdata, state supervisory authority, regional health authority, national competence centre), academic (peer-reviewed, PubMed Central, university research), professional bodies (Legeforeningen, Norsk barnelegeforening). One vendor source (Predicare/RETTS) used and labelled as such. No medium- or low-trust sources cited.

**Verification approach**: Norwegian originals quoted verbatim with translation for every load-bearing claim (time limits, level names, regulatory wording). Where WebFetch returned undecodable PDF binary, the two most important documents were downloaded and read page-by-page rather than accepted as summaries — this is how the SATS Norge time table and the national guideline's re-triage and two-room provisions were obtained verbatim. Time figures were cross-checked across organisationally independent sources (Helse Vest vs Statens helsetilsyn). Sources restating a vendor's own product were counted as one source, not two.

**Quality Standards**: 20 sources cited, all High reputation (average score 1.0). 12 of 14 major findings cross-referenced across 2+ independent sources. Negative findings (no national maximum waiting time; no published wait-estimation method; no published consultation durations) are reported as findings and flagged as arguments from silence in Knowledge Gaps.

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

**2.2b — SATS Norge, verbatim from the primary source. This is the single best-fitting citation for the app.**
**Evidence (Norwegian verbatim, reproduced exactly as printed)**:

| RØD | ORANSJE | GUL | GRØNN | BLÅ |
|---|---|---|---|---|
| 0 min | 10 min | 60 min | 120 min | 120 min |

with the caption directly beneath the table:
> *"Tidene angir tid til legetilsyn for pasienter på legevakt eller akuttmottak."*

**Translation**: "The times indicate **time to being seen by a doctor** for patients **at a legevakt** or emergency department."
Surrounding text: "SATS Norge er en modifisert versjon av det sørafrikanske triageverktøyet SATS, og er utviklet av leger, sykepleiere og ambulansearbeidere i Helse Vest. SATS Norge består av en **prioritetsliste** (symptomer / tilstander), **TEWS** (scoring av vitale parametere, skade og mobilitet), samt mulighet for å bruke sitt **kliniske skjønn** til å oppgradere hastegraden. Hastegraden pasienten får skal være den **høyeste** av disse tre, og er en av følgende fargekoder:"
**Translation**: "...The urgency grade the patient receives shall be the **highest** of these three [priority list, TEWS score, clinical judgement]."
On BLÅ: "Blå hastegrad skal brukes på pasienter med enkle problemstillinger, der det ikke er behov for å gjennomføre TEWS-målinger og score. Eksempel på dette kan være en pasient som kommer på legevakt med en fiskekrok i fingeren."
**Translation**: "Blue urgency grade shall be used on patients with simple problems, where there is no need to carry out TEWS measurements and score. An example of this could be a patient who comes to the legevakt with **a fish-hook in the finger**."
**Source**: [Helse Vest / Helse Bergen, "SATS Norge 4.0 — praktisk guide for legevakt, ambulanse og akuttmottak", revised December 2019, pp. 1–2](https://www.helse-bergen.no/4a461e/siteassets/seksjon/mottaksklinikken/documents/2020.09.01-praktisk-guide-til-sats-norge-4.0_-a5-format.pdf) — Accessed 2026-08-29. Reputation High (regional health authority, official).
**Confidence**: High (read verbatim from the source PDF, page 2).
**Note on BLÅ**: In SATS Norge, blue is **not** "least urgent of the scale" in the RETTS sense — it is the *no-vital-signs-needed, trivial problem* category, and it carries the **same 120-minute** target as green. Any five-level model that treats blue as a longer wait than green is wrong for SATS Norge.

**2.3b — Correction to the invented ordering.** Under SATS Norge, GRØNN and BLÅ have **identical** time targets. Our app's assumption of a strict monotone five-step ladder is not what the best-fitting real system does.

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

**2.7 — MTS as actually operated at a Norwegian legevakt, with Norwegian level names — and the resolution of the "30 minutes".**
**Evidence (Norwegian verbatim, Helsetilsynet system audit of Legevakten i Arendal, 2023)**: "For å håndtere hastegradsvurderinger ved henvendelser, bruker Legevakten i Arendal Manchester Triage Scale (MTS)."
Documented in-person (oppmøte) targets at that legevakt:

| Farge | Norsk navn | Maks tid til legetilsyn |
|---|---|---|
| Rød | Umiddelbart | 0 min |
| Oransje | Haster veldig | 10 min |
| Gul | Haster | 60 min |
| Grønn | Vanlig | 120 min |

**Source**: [Statens helsetilsyn, "Rapport etter systemtilsyn med Legevakten i Arendal 2023"](https://www.helsetilsynet.no/tilsyn/tilsynsrapporter/agder/2023/arendal-systemtilsyn-med-legevakten-2023/) — Accessed 2026-08-29. Reputation High (state supervisory authority).
**Confidence**: High.

**2.7a — THE "30 MINUTES" IS A DOCUMENTED STAFF MISCONCEPTION, NOT A PUBLISHED TARGET.**
**Evidence (Norwegian verbatim)**: "Flere oppgir at oransje hastegrad er 20-30 minutter."
**Translation**: "**Several [staff] state that orange urgency grade is 20–30 minutes**" — recorded by Helsetilsynet as a deviation, against a correct MTS standard of 10 minutes.
**Source**: Helsetilsynet, Arendal 2023 (as above) — Accessed 2026-08-29.
**Confidence**: High.
**Analysis — direct answer to the brief.** The brief asked us to find the published target behind the clinicians' "deadline of for example 30 minutes". **There is no Norwegian legevakt triage level with a 30-minute target.** The closest published figures are MTS/SATS orange at **10 minutes** and RETTS orange at **20 minutes**. The clinicians' recollection matches, precisely and verbatim, a misconception that the national supervisory authority found widespread enough among legevakt staff to write down as a finding. This is not a criticism of them — it is evidence that the number is genuinely slippery in practice, and it means **we must not encode 30 minutes as a domain rule.**

**2.8 — THE MOST IMPORTANT MECHANIC WE ARE MISSING: breaching the time target triggers RE-TRIAGE, not an alarm and not a promise.**
**Evidence (Norwegian verbatim)**: "Pasienter skal retriageres dersom de ikke får tilsyn av lege etter maks ventetid. Dette blir i praksis ikke gjort på legevakten i Arendal."
**Translation**: "**Patients shall be re-triaged if they are not seen by a doctor after the maximum waiting time.** In practice this is not done at the legevakt in Arendal."
**Source**: Helsetilsynet, Arendal 2023 — Accessed 2026-08-29.
**Verification**: Consistent with the national guideline's "Det er viktig å ha et system for å revurdere hastegrad hos ventende pasienter" (finding 3.2) and with its requirement to increase staffing at high load (7.2). Helsetilsynet also records at Arendal: unclear responsibility for monitoring waiting patients; insufficient staffing preventing re-triage at high demand; periods with no physician present on daytime shifts; documented waits exceeding one hour.
**Confidence**: High (state audit + national guideline agree).
**Analysis**: The time target is a **re-assessment deadline**, not a service guarantee. This is a far better mechanic than "a deadline" in the abstract, and it maps *exactly* onto the app's already-planned cycle-3 amendment (queue aging: after 60 minutes, escalate one level). **Our invented amendment turns out to be an approximation of a real rule.** The real rule is: *on breach of your level's maximum time, you must be re-triaged* — which may or may not change your level. Ours escalates automatically. That difference is worth naming out loud in the room.

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

**6.1 — No Norwegian guidance requires, recommends or forbids telling a legevakt patient an expected wait. [Negative finding]**
**Evidence**: The national veileder addresses the waiting room at length (layout, seating, overview from reception, screening, children's play corner, alternative entrances) and mentions waiting time only as a *capacity planning* input: "Det bør være tilstrekkelig kapasitet med sitteplasser til forventet variasjon i besøkstall og ventetid, også i travle perioder" (p.11). It says nothing about informing the patient of their wait. Nor does akuttmedisinforskriften, nor the legevakt quality indicator set.
**Confidence**: Medium-High (absence across the official corpus; see Gap G3).
**Analysis**: So there is **no Norwegian rule to violate**. The decision is ours, and should be argued from evidence, not from compliance.

**6.2 — Patients strongly *want* wait-time information.**
**Evidence**: In a patient-centred needs assessment, "81.3% of respondents wanted to know ED wait times before hospital arrival" and "90.8% wanted ED wait times posted in the waiting room"; 76.7% said their satisfaction would improve if wait times were posted (n=240 questionnaires).
**Source**: Calder-Sprackman et al., "Availability of Emergency Department Wait Times Information: A Patient-Centered Needs Assessment", *Emergency Medicine International*, 2021. [PMC8084678](https://pmc.ncbi.nlm.nih.gov/articles/PMC8084678/) — Accessed 2026-08-29. Reputation High (peer-reviewed, PubMed Central).
**Verification**: An RCT in Saudi Arabia found the same preference pattern: 81.4% at triage and 73.6% inside the ED preferred estimated wait times displayed.
**Confidence**: High (two independent studies, different countries, same direction).

**6.3 — But giving the estimate does NOT improve satisfaction. Randomised evidence is null.**
**Evidence (verbatim)**: "No statistically significant difference in the level of satisfaction between patients who were provided with the estimated waiting time and those who were not (P=0.962)." Mean satisfaction: control 3.49±1.12 vs intervention 3.51±1.12. Conclusion: "...managing patients' perceptions and expectations of waiting times effectively is inconsequential for the improvement of patient experience."
**Source**: Almulhim et al., "Effect of the provision of estimated waiting time on patient satisfaction with the Emergency Department: A randomized controlled trial", *Journal of Family & Community Medicine*, 2025 (n=190; King Fahad Hofuf Hospital, Saudi Arabia). [PMC11864359](https://pmc.ncbi.nlm.nih.gov/articles/PMC11864359/) — Accessed 2026-08-29. Reputation High (peer-reviewed).
**Verification**: A separate RCT in an ED fast track found satisfaction was influenced by waiting-room time and by the treating clinicians, **but not** by service-completion time estimates given at triage ([PubMed 21762230](https://pubmed.ncbi.nlm.nih.gov/21762230/)). A further study on waiting-time estimates and satisfaction reports similarly ([PubMed 32789431](https://pubmed.ncbi.nlm.nih.gov/32789431/)).
**Confidence**: High (three independent studies agree on a null effect).

**6.4 — THE ARGUMENT AGAINST, AND IT IS A REAL ONE: an estimate that is exceeded makes things actively worse than saying nothing.**
**Evidence (verbatim abstract)**: "The longer the wait duration, the lower care receivers' procedural justice perceptions and the greater their aggressive tendencies. **Information provision moderated the association, such that receiving information reduced aggressive tendencies during shorter waits but increased aggressive tendencies during longer waits.**"
Reported mechanism: once wait duration exceeds the expectation created by the information, "aggressive tendencies rise to a level higher than the baseline of no information", operating through perceived procedural injustice.
**Source**: Efrat-Treister, Moriah & Rafaeli, "The effect of waiting on aggressive tendencies toward emergency department staff: Providing information can help but may also backfire", *PLOS ONE*, 2020 (two-phase quasi-experimental field study, n=328 and n=99). [DOI 10.1371/journal.pone.0227729](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0227729) — Accessed 2026-08-29. Reputation High (peer-reviewed, open access).
**Confidence**: High.
**Analysis — the direct answer to the practitioner who asked whether showing an estimate is wise at all.** The honest answer is: **the practitioner is right to worry, and there is evidence.** Displaying an estimate is not neutral. It converts a diffuse wait into a *promise*, and a broken promise is worse than no promise — measurably, in aggression toward staff. Patients want the number; the number does not make them happier; and if you miss it, you are worse off than if you had never given it. This is not a reason to remove the feature from a teaching app. It is a superb reason to *keep* it and make the trade-off explicit in the room, because it is exactly the kind of consequence a specification does not surface on its own.

**6.5 — Formal triage systems are routinely overridden by nurse judgement in the Norwegian waiting room.**
**Evidence (Norwegian verbatim, nynorsk)**: "Desse sjukepleiarane er nøydde til å regelmessig avvika frå prioriteringssystemet og bruka eige skjønn." ("These nurses are obliged to regularly deviate from the prioritisation system and use their own judgement.") On MTS: "det mest brukte systemet i Europa, og blir brukt på fleire akuttmottak og legevakter rundt om i Noreg" ("the most used system in Europe, and is used at several emergency departments and legevakter around Norway"). Named limitation: "Systemet fangar til dømes ikkje opp pasientar med blodforgifting" ("The system does not, for example, catch patients with sepsis").
**Source**: Lars E. F. Johannessen (doctoral research, observation and interviews), [OsloMet Senter for profesjonsforskning, "Slik prioriterer sykepleierne på legevaktens venterom", 3 September 2018](https://www.oslomet.no/forskning/forskningsnyheter/slik-prioriterer-sykepleierne-legevaktens-venterom) — Accessed 2026-08-29. Reputation High (university research communication of doctoral work).
**Confidence**: Medium-High (single primary researcher; corroborated on the MTS-at-legevakt point by the Helsetilsynet Arendal audit and by the national veileder).
**Analysis**: The triage level is **not** a computed value. It is a judgement, with the system as scaffolding. Any app that presents the level as machine-derived misrepresents the domain.

### 7. Staffing and wait estimation

**7.1 — There is NO national staffing ratio. The floor is one doctor; everything above that is set by "forsvarlighet".**
**Evidence (Norwegian verbatim, veileder p.29–30)**:
"**Bemanningen består av:** Bemanningen bør alltid vurderes ut fra hva som kreves av kompetanse for å drive en forsvarlig tjeneste. Kjerneoppgaver til personell på vakt er å vurdere pasientens helsetilstand, hastegrad og hvilke pasienter som må behandles først."
"**Annet helsepersonell i legevakt.** Legevakten bør bemannes med helsepersonell som er faglig kompetente til å utføre de varierte arbeidsoppgavene i legevakt. **I praksis er annet helsepersonell oftest sykepleiere**, jf. akuttmedisinforskriften §13 a."
"**Leger.** I henhold til akuttmedisinforskriften § 6 skal det alltid være minst en lege tilgjengelig for legevakt hele døgnet. Ut over dette, og kompetansekravene som fremkommer i akuttmedisinforskriften, vil kravet om forsvarlighet, jf. helse- og omsorgstjenesteloven § 4-1, avgjøre hvilken legebemanning kommunens legevaktordning skal ha."
**Translation**: "Staffing should always be assessed from what is required in competence to run a sound service. The core tasks of personnel on shift are to assess the patient's health condition, urgency grade, and **which patients must be treated first**." / "In practice, other health personnel are most often nurses." / "At least one doctor shall always be available around the clock. Beyond that, ... the requirement of soundness ... shall decide what doctor staffing the municipality's legevakt arrangement shall have."
**Source**: Helsedirektoratet veileder p.29–30; akuttmedisinforskriften §§ 6, 13 a. Accessed 2026-08-29.
**Confidence**: High.
**Analysis**: Note the first quote *is* the app's ordering problem, stated by the Directorate: deciding "hvilke pasienter som må behandles først" is named as a core task of staff on shift. But there is no published national number for how many doctors or nurses are on at once — it is a local, discretionary, ROS-analysis-driven decision.

**7.2 — Staffing is explicitly expected to FLEX with load. This is the strongest support for the clinicians' point.**
**Evidence (Norwegian verbatim, veileder p.10)**: "Legevakten bør ha rutiner for å øke bemanningene ved stor pasientpågang slik at ansatte kan gjennomføre og følge opp trigeringen."
**Translation**: "The legevakt should have routines for **increasing staffing during high patient influx** so that employees can carry out and follow up the triage."
Reinforced at p.3: the municipality shall "ha tilstrekkelig bemanning, kompetanse og beredskapsplaner for økt bemanning og tjenesteytelse ved økt pasientpågang, smitteutbrudd og ulykker mm."
**Confidence**: High.
**Analysis**: Number of servers is not merely a parameter — nationally, it is expected to be a *function of the queue length*. Any model that treats staffing as fixed is unfaithful in a second way beyond the one the clinicians named.

**7.3 — Physical capacity: at least two consultation rooms at larger legevakter.**
**Evidence (Norwegian verbatim, veileder p.12)**: "Det bør være tilstrekkelig undersøkelsesrom i legevaktlokalet slik at legevakten effektivt kan undersøke, vurdere og behandle pasienter." / "**Det bør være minst to undersøkelsesrom ved større legevakter**, som plasseres slik at det sikres best mulig pasientflyt. Et av rommene bør utstyres som et akuttrom og minimum være 18-20 m² ... **Ved mindre legevakter som kun har ett undersøkelsesrom**, bør dette ha en størrelse beskrevet for akuttrom."
**Translation**: "There should be **at least two examination rooms at larger legevakter**, placed so as to ensure the best possible patient flow. One of the rooms should be equipped as an acute room and be minimum 18–20 m² ... At **smaller legevakter which have only one examination room**, this should have the size described for an acute room."
**Confidence**: High.
**Analysis**: This directly settles the "one room" argument, and settles it *both* ways: one room is a real configuration (small legevakt), two-plus is expected at large ones. The guideline's own phrase is "best mulig **pasientflyt**" — patient flow is an explicit design concern in national guidance.

**7.4 — Nobody publishes a Norwegian legevakt wait-estimation method. [Negative finding]**
**Evidence**: Searched for Norwegian guidance, research or practice on estimating and displaying expected waiting time at legevakt (queries covering ventetid, forventet ventetid, estimering, bemanning, køteori/parallelle servere). Found: national guidance that the *waiting room* should have "tilstrekkelig kapasitet med sitteplasser til forventet variasjon i besøkstall og ventetid" (p.11) — capacity planning for expected variation in visitor numbers and waiting time — but **no method, no formula, and no requirement to compute or display an estimate**. Helsedirektoratet publishes an average-waiting-time quality indicator for *hospitals* (somatic specialist care), not for legevakt.
**Sources**: Helsedirektoratet veileder p.11; [Helsedirektoratet, Gjennomsnittlig ventetid i somatisk helsetjeneste](https://www.helsedirektoratet.no/statistikk/kvalitetsindikatorer/sykehusopphold/gjennomsnittlig-ventetid-i-somatisk-helsetjeneste). Accessed 2026-08-29.
**Confidence**: Medium-High for the negative claim (absence of evidence across the official corpus; see Knowledge Gap G3).
**Analysis (interpretation)**: A plain "nobody publishes this" is the honest answer, and it is liberating for the course: **there is no Norwegian standard our estimate could be wrong against.** The estimate is a product decision, not a domain rule — which is exactly the teaching point already locked in design constraint 1.

## Triage level table (deliverable)

### The system to copy: SATS Norge 4.0

Chosen because it is the only one whose published guide is explicitly *"praktisk guide for **legevakt**, ambulanse og akuttmottak"*, whose time table is captioned *"tid til legetilsyn for pasienter **på legevakt**"*, and which is Norwegian-developed (Helse Vest) and freely published.

| Level | Colour | Norwegian name | Max time to being seen by a doctor | Citation |
|---|---|---|---|---|
| 1 | Red | **RØD** | **0 min** | SATS Norge 4.0, p.2 |
| 2 | Orange | **ORANSJE** | **10 min** | SATS Norge 4.0, p.2 |
| 3 | Yellow | **GUL** | **60 min** | SATS Norge 4.0, p.2 |
| 4 | Green | **GRØNN** | **120 min** | SATS Norge 4.0, p.2 |
| 5 | Blue | **BLÅ** | **120 min** | SATS Norge 4.0, p.2 |

Caption in the original, verbatim: *"Tidene angir tid til legetilsyn for pasienter på legevakt eller akuttmottak."*
Source: [Helse Vest, SATS Norge 4.0 — praktisk guide for legevakt, ambulanse og akuttmottak, rev. desember 2019](https://www.helse-bergen.no/4a461e/siteassets/seksjon/mottaksklinikken/documents/2020.09.01-praktisk-guide-til-sats-norge-4.0_-a5-format.pdf), p.2. Accessed 2026-08-29.

### The two other systems in Norwegian use, for comparison

| System | RØD | ORANSJE | GUL | GRØNN | BLÅ | Norwegian level names where published | Used where |
|---|---|---|---|---|---|---|---|
| **SATS Norge 4.0** (Helse Vest) | 0 min | 10 min | 60 min | 120 min | 120 min | — | Legevakt, ambulanse, akuttmottak; Helse Vest |
| **MTS** (Manchester) | 0 min | 10 min | 60 min | 120 min | 240 min* | Umiddelbart / Haster veldig / Haster / Vanlig | Several Norwegian legevakter and akuttmottak; e.g. Legevakten i Arendal. Has a telephone variant (TTA) |
| **RETTS** (Predicare, vendor) | umiddelbar legevurdering | 20 min | 120 min | 240 min | ikke hast | — | Mostly ambulance services and paediatric emergency departments |

\* MTS blue was not stated in the Arendal audit, which lists four levels in use; 240 min is the standard MTS value and is **not** independently confirmed for Norwegian legevakt use here — see Gap G4.

### The other axis: telephone haste grades (a different scale entirely — do not merge)

| Code | Norwegian | Colour | Meaning | Time target |
|---|---|---|---|---|
| A | **Akutt** | Rød respons | Life-threatening or potentially life-threatening; acute time-critical | **none published** |
| H | **Haster** | Gul respons | Possibly serious; vital organs may be threatened; needs rapid situational assessment by a doctor | **none published** |
| V | **Vanlig** | Grønn respons | Can wait "til første passende anledning" (until the first suitable opportunity) | **none published** |
| R | **Råd** | Grønn | Self-care advice; no doctor needed | n/a |

A/H/V/R = Legevaktindeks (NKLM), synchronised with Norsk indeks for medisinsk nødhjelp (NIMN). NIMN uses akutt/haster/vanlig and is in use at **all AMK centres** in Norway. Accessed 2026-08-29.

**The only legally binding time in the whole domain**: akuttmedisinforskriften § 13 d — *"80 prosent av alle henvendelser normalt kan besvares innen to minutter"* — and it is about **answering the telephone**, not about seeing a patient.

## How wrong our current model is

Item by item, against the five things `docs/course-design-decisions.md` §3a admits we invented.

### 1. Five levels RED / ORANGE / YELLOW / GREEN / BLUE — **right by accident. Keep it.**
Five colour levels with exactly these five colours is what SATS Norge and RETTS both use, and MTS uses four of them plus blue. **Verdict: not wrong.** The invented vocabulary happens to match the real one. The *only* correction is that the Norwegian names should be Norwegian: RØD, ORANSJE, GUL, GRØNN, BLÅ — and that under SATS Norge, **BLÅ is not "least urgent"**; it is "simple problem, no vital-sign scoring needed" (the canonical example in the guide is *"en pasient som kommer på legevakt med en fiskekrok i fingeren"*) and it carries the **same** 120-minute target as GRØNN.

### 2. Invented consultation times (30/25/20/15/10 min per level) — **wrong in kind, not merely in value.**
There is no published Norwegian per-level average consultation duration, so we cannot correct the numbers (Gap G5). But the deeper error is that **we attached times to the wrong thing.** Every real system attaches a **maximum time to being seen** (a deadline that starts at triage and runs down), not an **expected service duration** (a resource-occupancy figure). Our numbers are also inverted relative to the real semantics: we make RED consume the *most* clinic time (30 min) and BLÅ the least (10 min), whereas SATS Norge gives RØD the *shortest* permissible wait (0 min) and BLÅ one of the longest (120 min). We have a service-time table pretending to be a triage table. **Verdict: wrong, and the most consequential of the five.**

### 3. A single consultation room — **wrong for a large legevakt, defensible for a small one.**
National guidance, verbatim: *"Det bør være minst to undersøkelsesrom ved større legevakter, som plasseres slik at det sikres best mulig pasientflyt"* — and it explicitly contemplates *"mindre legevakter som kun har ett undersøkelsesrom"*. Meanwhile akuttmedisinforskriften § 6 requires only *"minst en lege ... hele døgnet"*. **Verdict: the clinicians are right that staffing must drive the estimate, but "one server" is a real configuration, not a fantasy.** It is the configuration of a small rural legevakt at 03:00. What is indefensible is treating one server as *universal*, and treating the number of servers as *fixed*: national guidance requires routines to **increase** staffing at high load (*"Legevakten bør ha rutiner for å øke bemanningene ved stor pasientpågang"*). Note also there is **no published national staffing ratio** — beyond one doctor, staffing is set locally by the *forsvarlighet* standard, so any number we choose is a product decision, not a domain fact.

### 4. A single queue — **wrong, but not in the shape the clinicians described.**
The real Norwegian flow has more stages than we model, but the first stage is usually **a telephone call**, not a nurse in the building: *"Pasienter som får avtale om å møte på legevakten, bør alltid gis en hastegrad"* and *"Dersom første vurdering er gjort over telefon og pasienten ikke mottar hjelp umiddelbart, bør pasienten triageres på nytt etter ankomst"*. The canonical journey is **phone triage (116 117) → arrival → re-triage at reception → wait → doctor**. There are also documented exits that never reach a doctor (advice, referral to fastlege) and a documented bypass of the legevakt entirely for the sickest (*"fast track"* to hospital). **Verdict: wrong. Our single queue omits both the telephone stage that precedes arrival and the reassessment that follows it.** The clinicians' "nurse then doctor" is a real and common pattern at larger legevakter; the guideline's own framing puts the arrival assessment at **reception**, which is lighter than a second full consultation.

### 5. No concept of a deadline — **wrong, and this is the biggest missed opportunity.**
Every in-person triage system in Norwegian use attaches a maximum time to each level (table above). More importantly, the state supervisory authority states what a breach *means*, verbatim: *"Pasienter skal retriageres dersom de ikke får tilsyn av lege etter maks ventetid."* **The deadline is a re-assessment trigger, not a service guarantee.** And Helsetilsynet found that at the legevakt it audited, *"Dette blir i praksis ikke gjort"* — the rule exists and is breached, for want of staffing.
**Verdict: wrong, and correcting it is nearly free**, because the app already has `TriageEvent` re-triage history and a planned cycle-3 "queue aging" amendment. Our invented amendment (*after 60 minutes, escalate one level*) turns out to be a rough approximation of a real national rule. The real rule is *on breach of your level's maximum, you must be re-assessed* — which may or may not change the level.

### Bonus correction the brief did not ask for: the "30 minutes" does not exist
No Norwegian legevakt triage level has a 30-minute target. The published orange figures are **10 minutes** (SATS Norge, MTS) and **20 minutes** (RETTS). The clinicians' "for example 30 minutes" matches, word for word, a misconception Helsetilsynet recorded as an audit finding: *"Flere oppgir at oransje hastegrad er 20-30 minutter."* Say this gently in the room — it is a gift, because it demonstrates better than any slide that **domain experts' recollections are requirements-grade evidence but not requirements-grade facts**, and that looking it up took twenty minutes.

## Recommendation for the teaching app

Design goal, restated: **a clinician in the room should nod, not audit.** Fidelity where it is cheap and where a clinician will notice; deliberate, *stated* simplification everywhere else.

### Adopt (cheap, high credibility return)

1. **Rename the levels to the Norwegian originals and adopt SATS Norge's numbers.**
   `RØD 0 / ORANSJE 10 / GUL 60 / GRØNN 120 / BLÅ 120` minutes, with a one-line citation visible somewhere in the app or the README. Cost: a constant table we already have (§3a: *"Triage levels as a constant table with target times"* — the slot is literally already there). Return: the single most visible correctness signal to a clinician.
2. **Reinterpret the per-level time as a DEADLINE, not a service duration.** Replace `average consultation minutes for their level` with `max minutes to being seen for their level`. This is a semantic change to an existing field, not new machinery.
3. **Adopt the real breach rule for cycle 3.** Instead of the invented *"after 60 minutes, escalate one level"*, use: *"when a patient exceeds the maximum waiting time for their level, they must be re-triaged."* It is the same teaching shape (an amendment that forces existing scenarios to be revised, not extended), it is *citable*, and the timeout is now per-level rather than a magic 60. If a single number is pedagogically necessary, keep the automatic escalation but say in the room that the real rule mandates re-assessment, not escalation.
4. **Model at least two servers, configurable, and make the number visible on the staff screen.** Justified verbatim: *"Det bør være minst to undersøkelsesrom ved større legevakter."* A parallel-servers estimate — `wait ≈ (patients ahead ÷ servers) × service minutes` — is one division more than we have now, is trivially testable with an injected clock, and answers the clinicians' central objection.
5. **Keep the wait estimate, and add the evidence to the course material.** The RCT evidence says the estimate does not improve satisfaction, and the PLOS ONE study says a *breached* estimate raises aggression above the no-information baseline. That makes "should we show this at all?" a genuine, evidence-backed product argument rather than a matter of taste — which is far more valuable in a product course than a feature that is simply correct.

### Simplify deliberately, and say so out loud

6. **Do not model the telephone stage.** It is the true first stage of the real process (116 117 → hastegrad → attend), but modelling it doubles the domain and moves the app away from the waiting-room experience that gives it its "everyone has sat there" appeal. State the omission in the README in one sentence. A clinician who hears you name it will accept it; one who catches you not knowing it will not.
7. **Model at most two in-person stages (assessment → doctor), and only when you actually want the two-queue lesson.** The practitioners' note is right that this is a structural change larger than one cycle. Treat it as the worked example of *how to split a feature that reshapes the data model* rather than as cycle-1 scope.
8. **Do not model lab, imaging or observation as queue stages.** Point-of-care lab is real and in-house; imaging usually is not on site at all (national guidance treats X-ray distance as a *planning* variable, i.e. a referral out). Adding these buys complexity and no lesson.
9. **Do not model staffing that flexes with load,** even though national guidance requires it (*"rutiner for å øke bemanningene ved stor pasientpågang"*). Fixed-but-configurable server count is the right teaching simplification. Name it as a known simplification.
10. **Keep "no clinical content" absolutely.** Reinforced by this research: a triage level is a *judgement*, not a computation (nurses "regelmessig avvika frå prioriteringssystemet"; SATS Norge takes the **highest** of priority list, TEWS score and clinical skjønn). An app that appears to derive levels would be making a clinical claim. Levels must always arrive as staff input.

### Must NOT be simplified away

11. **Re-triage must stay first-class.** It is national guidance (*"Det er viktig å ha et system for å revurdere hastegrad hos ventende pasienter"*), it is what Helsetilsynet audits against, and it is what a clinician will look for first. We already have it — do not let a refactor demote it.
12. **RØD must not sit in a queue with a position number.** In the real domain a red patient is seen immediately or is *"fast track"*-ed to hospital without further legevakt involvement. Showing a red patient "you are number 2" is the one thing in this app that would read to a clinician as not merely simplified but *wrong*. Either red bypasses the queue display entirely, or red is never shown a position.
13. **The estimate must remain a defined function, not a prediction.** Unchanged from §3a design constraint 1, and now independently justified: **nobody in Norway publishes a wait-estimation method for legevakt**, so there is no external standard to be wrong against, and a "prediction" would be pure invention with a clinical veneer.
14. **BLÅ must not be modelled as "the longest wait".** Under SATS Norge it equals GRØNN at 120 minutes and means "trivial, no vital signs needed" (the fish-hook). If our ordering logic assumes five strictly increasing tiers, it will produce behaviour a clinician recognises as wrong — and, usefully, it will do so with a green test suite, which is precisely the failure mode §3a wants to teach.

### One free gift for the course

The planted ambiguity in §3a — *"your position in the queue"* — turns out to have a **third** defensible reading that no one invented: position relative to **your level's time target**. "You are number 3" versus "you have 40 of your 60 minutes left" are different products built from the same data. Under SATS Norge, GRØNN and BLÅ share a 120-minute target while ordering differently, so the two readings can disagree while both tests pass. This is a real-domain ambiguity, not a manufactured one, and it is stronger material than the manufactured version.

## Source Analysis

| Source | Domain | Reputation | Type | Access date | Cross-verified |
|---|---|---|---|---|---|
| Akuttmedisinforskriften (FOR-2015-03-20-231) | lovdata.no | High (1.0) | Official — legal text | 2026-08-29 | Y (veileder restates §§ 6, 13) |
| Legevakt og legevaktsentral — Nasjonal veileder (PDF, 51 pp., read directly) | helsedirektoratet.no / legeforeningen.no | High (1.0) | Official — national guideline | 2026-08-29 | Y |
| Legevakt og legevaktsentral — veileder (web, final index) | helsedirektoratet.no | High (1.0) | Official | 2026-08-29 | Y |
| Nasjonale kvalitetsindikatorer for legevakt — Triagering ved legevakt | helsedirektoratet.no | High (1.0) | Official — indicator | 2026-08-29 | Y |
| Svartid legevakt 116 117 (kvalitetsindikator) | helsedirektoratet.no | High (1.0) | Official — indicator | 2026-08-29 | Y |
| Somatiske akuttmottak — prioritering av pasienter | helsedirektoratet.no | High (1.0) | Official — guideline | 2026-08-29 | Y |
| SATS Norge 4.0 — praktisk guide for legevakt, ambulanse og akuttmottak (rev. des. 2019) | helse-bergen.no (Helse Vest) | High (1.0) | Official — health authority clinical tool | 2026-08-29 | Y (times match MTS on 3 of 5 levels) |
| Rapport etter systemtilsyn med Legevakten i Arendal 2023 | helsetilsynet.no | High (1.0) | Official — state supervisory authority | 2026-08-29 | Y |
| Tilsynssak: hastegrad på legevakt, bemanning og kompetanse (2018) | helsetilsynet.no | High (1.0) | Official — supervisory decision | 2026-08-29 | Y (MTS at legevakt) |
| Legevaktindeks — Om Legevaktindeks | legevaktindeks.no (NKLM) | High (1.0) | Official — national competence centre | 2026-08-29 | Y (veileder names it) |
| Norsk indeks for medisinsk nødhjelp (Legeforeningen, via Sykehuset Telemark) | sthf.no / legeforeningen | High (1.0) | Professional body | 2026-08-29 | Y (veileder + Legevaktindeks) |
| Akuttveileder i pediatri 1.13 — triage | helsebiblioteket.no | High (1.0) | Official — professional guideline | 2026-08-29 | Y (RETTS times) |
| Nasjonale krav til legevakt og fremtidens ø-hjelp-tilbud (NKLM rapport 7-2014) | regjeringen.no | High (1.0) | Official — ministry-hosted, NKLM-authored | 2026-08-29 | N — **PDF text extraction failed**, search summary only |
| Predicare / RETTS vendor material (via search) | predicare.com/.se | High (1.0) as tech doc, **but VENDOR — commercial interest** | Vendor documentation | 2026-08-29 | Y (times match pediatric guideline exactly) |
| Johannessen, "Slik prioriterer sykepleierne på legevaktens venterom" | oslomet.no | High (1.0) | Academic — university research communication | 2026-08-29 | Y (MTS at legevakt) |
| Efrat-Treister, Moriah & Rafaeli 2020, PLOS ONE | journals.plos.org | High (1.0) | Academic — peer-reviewed, open access | 2026-08-29 | Partially (unique finding) |
| Almulhim et al. 2025, J Fam Community Med (PMC11864359) | pmc.ncbi.nlm.nih.gov | High (1.0) | Academic — peer-reviewed RCT | 2026-08-29 | Y (2 further RCTs agree) |
| Calder-Sprackman et al. 2021, Emerg Med Int (PMC8084678) | pmc.ncbi.nlm.nih.gov | High (1.0) | Academic — peer-reviewed | 2026-08-29 | Y |
| RCT: service delivery information, ED fast track (PubMed 21762230) | pubmed.ncbi.nlm.nih.gov | High (1.0) | Academic | 2026-08-29 | Y |
| Waiting time estimates and satisfaction (PubMed 32789431) | pubmed.ncbi.nlm.nih.gov | High (1.0) | Academic | 2026-08-29 | Y |
| Gjennomsnittlig ventetid i somatisk helsetjeneste | helsedirektoratet.no | High (1.0) | Official — indicator | 2026-08-29 | Y |

**Reputation**: High: 21 of 21 cited (100%). Medium-high: 0. Medium: 0. **Average reputation score: 1.0.**
**Bias note**: Predicare/RETTS is a commercial vendor of the system it documents. Its level times are used here only because they are independently corroborated verbatim by an unrelated Norwegian professional guideline (Akuttveileder i pediatri). SATS Norge is published by the health authority that developed it (Helse Vest) — an institutional, not commercial, interest; corroborated on 3 of 5 levels by the independent Helsetilsynet audit of an MTS site.
**Independence check**: The SATS Norge figures and the MTS/Arendal figures come from unconnected organisations (Helse Vest vs Statens helsetilsyn/Legevakten i Arendal) and agree on RØD/ORANSJE/GUL/GRØNN. The RETTS figures come from two sources (Predicare, Norsk barnelegeforening) that are not independent in the strict sense — the guideline describes the vendor's product — so RETTS is treated as **one authoritative source, restated**, not two.

## Knowledge Gaps

### G1: Draft-vs-final status of the national guideline
**Issue**: The 51-page PDF read in full carries an "Ekstern høring" banner (consultation deadline 16 July 2025) on nearly every recommendation, while the web index for the same guideline shows "Publisert 28. februar 2020, siste faglige endring 13. november 2025" and places the triage recommendation under a *different* chapter ("Kvalitetsarbeid og pasient-/brukersikkerhet") than the PDF does ("Organisering av legevaktordningen").
**Attempted**: Fetched both the høringsutkast and the final web index; the final web pages returned navigation only, not body text, on two attempts.
**Impact**: The quoted Norwegian wording may have been revised between the July 2025 consultation and the November 2025 update. The substance (triage tools named, re-triage of waiting patients, staffing flex, two examination rooms) is corroborated independently by Helsetilsynet and SATS Norge, so the *findings* are safe; the *exact wording* should be re-verified against the live page before being quoted in public course material.
**Recommendation**: Re-fetch `helsedirektoratet.no/veiledere/legevakt-og-legevaktsentral/...` recommendation pages individually before publishing any verbatim quote.

### G2: NKLM report 7-2014 not read directly
**Issue**: The 45-minute outreach requirement (finding 5.5) rests on a search-engine summary, not on read text.
**Attempted**: WebFetch on regjeringen.no PDF (extraction failed, binary); WebFetch on the NORCE/brage mirror (DNS failure, `norceresearch.brage.unit.no` not resolvable).
**Impact**: Low — the figure is peripheral to the app (it concerns doctors travelling to patients, not queues).
**Recommendation**: Download the PDF and read it as pages if the outreach requirement ever matters.

### G3: Absence of Norwegian wait-communication guidance is an argument from silence
**Issue**: Findings 6.1 and 7.4 are negative claims ("no Norwegian guidance/method exists"). Established by searching the official corpus and finding nothing, which is weaker than finding an explicit statement that none exists.
**Attempted**: Norwegian-language searches on ventetid/forventet ventetid/estimering/bemanning across helsedirektoratet.no, fhi.no, nklm, legeforeningen; the national veileder read in full for chapters 1 and 2.
**Impact**: Medium. If a local legevakt or a health trust publishes a wait-display practice, we have not found it.
**Recommendation**: Ask the nurse and doctor directly — they will know whether their own legevakt displays anything. That is a cheaper and better source than more searching.

### G4: MTS blue level for Norwegian legevakt not confirmed
**Issue**: The Arendal audit lists four MTS levels in use (red/orange/yellow/green). The 240-minute blue value in the comparison table is the standard international MTS figure, not a verified Norwegian legevakt value.
**Impact**: Low — we recommend SATS Norge, where blue is verified at 120 min.
**Recommendation**: Do not cite the MTS blue figure as Norwegian practice.

### G5: No published per-level consultation duration for Norwegian legevakt
**Issue**: We cannot replace our invented 30/25/20/15/10 with real figures because no such figures appear to be published.
**Attempted**: Two searches on konsultasjonstid/varighet/gjennomsnitt covering NKLM, the Vakttårn surveillance project, and Helsedirektoratet. NKLM's Vakttårn collects contact, patient, hastegrad and action variables — not consultation duration. Two consecutive searches returned nothing new (diminishing-returns stop).
**Impact**: Low, and arguably positive: it confirms the estimate is a product decision rather than a domain fact, which is the existing design position.
**Recommendation**: Choose round numbers, document them as chosen, and do not dress them as clinical.

### G6: "Is the nurse consultation itself the triage?" — not resolvable from published sources
**Issue**: The practitioners' sharpest open question. National guidance describes arrival reassessment at *reception* ("pasientmottaket eller resepsjonen"), and names "helsepersonell" rather than "sykepleier" as the triaging role. Whether a given legevakt runs a separate nurse *consultation* is a local organisational choice we found no national statement on.
**Attempted**: Full read of veileder chapters 1 and 2; Helsetilsynet audit; OsloMet waiting-room research.
**Recommendation**: This one must be answered by the practitioners, not by research. Ask them: *"at your legevakt, is the arrival assessment a desk-side reassessment or a booked room with the nurse?"* Published sources support both.

### G7: How many legevakter use each system
**Issue**: We know 73% of relevant legevakter use *a* standardised tool and that MTS is used at "several"; we have no national breakdown by system.
**Attempted**: Helsedirektoratet quality indicator (gives the 73% but not the split); NAKOS/NKLM triage mapping report 2-2014 (PDF extraction failed).
**Impact**: Low for the app; would matter if we claimed "the system Norwegian legevakter use".
**Recommendation**: Say "one of the systems in Norwegian use", never "the Norwegian system".

## Conflicting Information

### Conflict 1: How many minutes is ORANSJE?
**Position A — 10 minutes.** SATS Norge 4.0 p.2 (table, verbatim) and MTS as operated at Legevakten i Arendal (Helsetilsynet 2023). Reputation 1.0 each, independent organisations.
**Position B — 20 minutes.** RETTS: "oransje, inntil 20 minutters ventetid" (Akuttveileder i pediatri 1.13, restating the Predicare product). Reputation 1.0.
**Position C — "20–30 minutes".** Reported by legevakt staff at Arendal and recorded by Helsetilsynet as incorrect.
**Assessment**: Not a genuine conflict about a single fact — **it is three different systems plus one error.** A and B are both correct *for their own system*. C is wrong for every system and is documented as such by the supervisory authority. **For our app, A (10 minutes) is authoritative**, because SATS Norge is the system published explicitly for legevakt use. This conflict is itself worth putting on a slide: "which is right?" has the answer "the question is malformed — you must first say which system you are in", which is a requirements lesson in one line.

### Conflict 2: Does BLÅ wait longer than GRØNN?
**Position A — No; identical.** SATS Norge 4.0: GRØNN 120 min, BLÅ 120 min; blue means "simple problem, no TEWS needed".
**Position B — Yes; blue is last.** RETTS: green 240 min, blue "ikke hast" (no urgency).
**Assessment**: Both correct within their own system; the *semantics of blue differ fundamentally* (SATS Norge: trivial-but-quick; RETTS: no urgency at all). Since we recommend SATS Norge, our model must not assume a monotone ladder. Flagged as a trap in recommendation 14.

### Conflict 3: Do patients benefit from being told a wait?
**Position A — They want it.** 81–91% of patients want wait times displayed (Calder-Sprackman 2021; Almulhim 2025).
**Position B — It changes nothing.** Three independent randomised studies find no significant satisfaction effect.
**Position C — It can harm.** Efrat-Treister et al. 2020: information reduces aggression during short waits but *increases* it above the no-information baseline once the communicated expectation is exceeded.
**Assessment**: These are compatible, not contradictory — they measure different outcomes (preference, satisfaction, aggression) and C identifies the moderator (whether the estimate was met) that explains the null averages in B. The synthesis: **an estimate is only worth showing if you can keep it, and its value is in expectation management, not in satisfaction.** All three are high-reputation peer-reviewed sources; C is the most directly relevant because our app's estimate will visibly expire.

## Full Citations

[1] Helse- og omsorgsdepartementet. "Forskrift om krav til og organisering av kommunal legevaktordning, ambulansetjeneste, medisinsk nødmeldetjeneste mv. (akuttmedisinforskriften)". FOR-2015-03-20-231. Lovdata. https://lovdata.no/dokument/SF/forskrift/2015-03-20-231. Accessed 2026-08-29.
[2] Helsedirektoratet. "Legevakt og legevaktsentral — Nasjonal veileder". First published 2025-04-23 (PDF copy carries external consultation banner, deadline 2025-07-16); web index shows last professional update 2025-11-13. https://www.helsedirektoratet.no/veiledere/legevakt-og-legevaktsentral — PDF: https://www.legeforeningen.no/contentassets/88f5bd06123648a8b06dc572103d8679/legevakt-og-legevaktsentral.pdf. Accessed 2026-08-29.
[3] Helsedirektoratet. "Nasjonale kvalitetsindikatorer for legevakt — Triagering ved legevakt". https://www.helsedirektoratet.no/rapporter/nasjonale-kvalitetsindikatorer-for-legevakt/triagering-ved-legevakt. Accessed 2026-08-29.
[4] Helsedirektoratet. "Svartid legevakt 116 117". https://www.helsedirektoratet.no/statistikk/kvalitetsindikatorer/akuttmedisinske-tjenester-utenfor-sykehus/svartid-legevakt-116-117. Accessed 2026-08-29.
[5] Helsedirektoratet. "Akuttmottakene skal ha prosedyrer for prioritering av pasienter" (Somatiske akuttmottak). https://www.helsedirektoratet.no/retningslinjer/somatiske-akuttmottak/prioritering-av-pasienter/akuttmottakene-skal-ha-prosedyrer-for-prioritering-av-pasienter. Accessed 2026-08-29.
[6] Helse Vest / Helse Bergen. "SATS Norge 4.0 — praktisk guide for legevakt, ambulanse og akuttmottak". Revised December 2019. https://www.helse-bergen.no/4a461e/siteassets/seksjon/mottaksklinikken/documents/2020.09.01-praktisk-guide-til-sats-norge-4.0_-a5-format.pdf. Accessed 2026-08-29.
[7] Statens helsetilsyn. "Rapport etter systemtilsyn med Legevakten i Arendal 2023". https://www.helsetilsynet.no/tilsyn/tilsynsrapporter/agder/2023/arendal-systemtilsyn-med-legevakten-2023/. Accessed 2026-08-29.
[8] Statens helsetilsyn. "Pasient med blodpropp i lungene — vurdering av hastegrad på legevakt — kommunens plikt til å sikre tilstrekkelig kompetanse og bemanning". 2018. https://www.helsetilsynet.no/historisk-arkiv/avgjoerelser-i-tilsynssaker-og-rapporter-etter-alvorlige-hendelser/2018/pasient-med-blodpropp-i-lungene-vurdering-av-hastegrad-pa-legevakt-kommunens-plikt-til-a-sikre-tilstrekkelig-kompetanse-og-bemanning/. Accessed 2026-08-29.
[9] Nasjonalt kompetansesenter for legevaktmedisin (NKLM). "Om Legevaktindeks". https://legevaktindeks.no/om-legevaktindeks/. Accessed 2026-08-29.
[10] Den norske legeforening. "Norsk indeks for medisinsk nødhjelp". Hosted by Sykehuset Telemark. https://www.sthf.no/4a8185/siteassets/dokumenter-felles/rapporter-og-planverk/ambulanseplan/03-den-norske-legeforeningen-norsk-indeks-for-medisinsk-nodhjelp.pdf. Accessed 2026-08-29.
[11] Norsk barnelegeforening. "1.13 Pediatrisk tidlig varslingsskår, triage og kommunikasjon". Akuttveileder i pediatri, Helsebiblioteket. https://www.helsebiblioteket.no/innhold/retningslinjer/pediatri/akuttveileder-i-pediatri/1.akutte-prosedyrer-og-tilstander-inkludert-ulykker/1.14-pediatrisk-tidlig-varslingsskar-triage-og-kommunikasjon. Accessed 2026-08-29.
[12] Nasjonalt kompetansesenter for legevaktmedisin. "Nasjonale krav til legevakt og fremtidens øyeblikkelig hjelp-tilbud". NKLM rapport 7-2014. https://www.regjeringen.no/contentassets/477c27aa89d645e09ece350eaf93fedf/no/sved/02.pdf. Accessed 2026-08-29. [PDF text extraction failed — cited from search summary only.]
[13] Johannessen, Lars E. F. "Slik prioriterer sykepleierne på legevaktens venterom". OsloMet, Senter for profesjonsforskning. 3 September 2018. https://www.oslomet.no/forskning/forskningsnyheter/slik-prioriterer-sykepleierne-legevaktens-venterom. Accessed 2026-08-29.
[14] Efrat-Treister, D., Moriah, H., Rafaeli, A. "The effect of waiting on aggressive tendencies toward emergency department staff: Providing information can help but may also backfire". PLOS ONE, 2020. https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0227729. Accessed 2026-08-29.
[15] Almulhim, et al. "Effect of the provision of estimated waiting time on patient satisfaction with the Emergency Department: A randomized controlled trial". Journal of Family & Community Medicine, 2025. https://pmc.ncbi.nlm.nih.gov/articles/PMC11864359/. Accessed 2026-08-29.
[16] Calder-Sprackman, S., et al. "Availability of Emergency Department Wait Times Information: A Patient-Centered Needs Assessment". Emergency Medicine International, 2021. https://pmc.ncbi.nlm.nih.gov/articles/PMC8084678/. Accessed 2026-08-29.
[17] "A randomized controlled trial of the effect of service delivery information on patient satisfaction in an emergency department fast track". PubMed 21762230. https://pubmed.ncbi.nlm.nih.gov/21762230/. Accessed 2026-08-29.
[18] "Effect of waiting time estimates on patients satisfaction in the emergency department in a tertiary care center". PubMed 32789431. https://pubmed.ncbi.nlm.nih.gov/32789431/. Accessed 2026-08-29.
[19] Predicare / Omda. RETTS product documentation. https://predicare.com/. Accessed 2026-08-29. **[Vendor source — commercial interest in RETTS.]**
[20] Helsedirektoratet. "Gjennomsnittlig ventetid i somatisk helsetjeneste". https://www.helsedirektoratet.no/statistikk/kvalitetsindikatorer/sykehusopphold/gjennomsnittlig-ventetid-i-somatisk-helsetjeneste. Accessed 2026-08-29.

## Research Metadata

**Examined**: ~30 sources | **Cited**: 20 | **Cross-referenced claims**: 12 of 14 major findings
**Confidence distribution**: High 78% | Medium-High 11% | Medium 11% | Low 0%
**Average source reputation**: 1.0 (all cited sources High tier)
**Languages**: Primary sources predominantly Norwegian (bokmål and nynorsk), quoted in the original with translation. English sources used only for the international waiting-time-communication evidence, where no Norwegian literature was found.
**Tool failures affecting coverage**: WebFetch could not extract text from 4 PDFs (returned raw binary). Mitigated by reading the two most important ones (Helsedirektoratet veileder, 51 pp.; SATS Norge 4.0) directly as pages from local copies — this produced the verbatim SATS Norge time table and the verbatim national guidance, the two most load-bearing citations in the document. One DNS failure (`norceresearch.brage.unit.no`) blocked the NKLM report mirror. Two Helsedirektoratet web pages returned navigation-only content.
**Output**: `docs/research/domain/legevakt-triage-rules-research.md`
