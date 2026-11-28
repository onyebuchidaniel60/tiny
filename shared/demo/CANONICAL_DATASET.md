# Tiny — Canonical Synthetic Dataset

**Purpose:** one fictional Nigerian primary-school workspace used by both the Android teacher app and the web companion. Identifiers, pupils, guardians, attendance, assessments, observations, follow-ups, lessons and messages are identical on both platforms.

**Safety:** every person, phone number, school and record below is synthetic. Do not replace it with real child or guardian data. The workspace is intentionally small enough to inspect by hand.

**Source files**

| Platform | File | Role |
|---|---|---|
| Android | `app/src/main/java/ng/tiny/education/data/DemoData.kt` | Room seed used when no workspace exists |
| Web | `web/src/data/seed.ts` | IndexedDB/local demo seed |
| Guard | `tools/check-canonical-dataset.mjs` | Fails CI if IDs or canonical literals diverge |

The guard runs in both `android-ci` and `web-ci`.

## 1. Workspace and teacher

| Field | Value |
|---|---|
| Workspace ID | `ws_kofar_primary` |
| Name | Kofar Primary |
| Type | `school` |
| School code | `KOFAR001` |
| Verification | `active_unverified` |
| Academic year | `2026/2027` |
| Teacher persona | Ms. Bello |
| Demo date range | 6–27 November 2026 |

The Android app seeds this workspace locally when Room is empty. The web app seeds it when no local snapshot exists; Firebase sign-in bootstraps the same collection names from the preview project when configured. Local and cloud modes are labelled separately in the UI and in `docs/CROSS_PLATFORM_SYNC.md`.

## 2. Classes and pupils

| Class ID | Grade | Section | Subjects |
|---|---|---|---|
| `class_p4_blue` | P4 | Blue | Basic Science, Mathematics, English |
| `class_p5_gold` | P5 | Gold | Basic Science, Social Studies |

| Pupil ID | Name | Code | Class |
|---|---|---|---|
| `pupil_amina` | Amina Bello | KOF001 | P4 Blue |
| `pupil_musa` | Musa Ibrahim | KOF002 | P4 Blue |
| `pupil_ngozi` | Ngozi Okafor | KOF003 | P4 Blue |
| `pupil_tunde` | Tunde Adeyemi | KOF004 | P4 Blue |
| `pupil_fatima` | Fatima Sani | KOF005 | P5 Gold |
| `pupil_emeka` | Emeka Nwosu | KOF006 | P5 Gold |
| `pupil_zainab` | Zainab Bello | KOF007 | P5 Gold |
| `pupil_ibrahim` | Ibrahim Musa | KOF008 | P5 Gold |

Eight pupils, two classes.

## 3. Guardians and links

| Guardian ID | Name | Phone | Locale | Verification | Pupils |
|---|---|---|---|---|---|
| `guardian_amina` | Mrs. Bello | +2348000000011 | en | verified / opted in | Amina |
| `guardian_musa` | Mr. Ibrahim | +2348000000012 | ha | verified / opted in | Musa, Ngozi, Tunde |
| `guardian_fatima` | Mrs. Sani | +2348000000013 | en | verified / opted in | Fatima |
| `guardian_emeka` | Mr. Nwosu | +2348000000014 | ig | pending / pending | Emeka, Ibrahim |

`guardian_musa` deliberately demonstrates one phone endpoint serving multiple pupils. The rule is one guardian profile per normalized phone per workspace; links are many-to-many.

## 4. Attendance history

Seven submitted school days for each class: **17, 18, 19, 20, 24, 25, 26 November 2026**.

P4 Blue patterns:

| Pupil | Pattern | Marked | Attended | Rate |
|---|---|---:|---:|---:|
| Amina | present, present, present, present, present, late, present | 7 | 7 | 100% |
| Musa | absent, absent, present, absent, present, absent, present | 7 | 3 | 43% |
| Ngozi | present, present, present, late, present, present, present | 7 | 7 | 100% |
| Tunde | late, present, absent, late, present, absent, present | 7 | 5 | 71% |

P5 Gold patterns are generated deterministically: Fatima and Zainab present every day; Emeka absent on the second and fifth sessions; Ibrahim late on the fourth session. All others present.

## 5. Assessments

Three assessments per pupil = **24 records**, all out of 100, dated 6, 13 and 20 November 2026.

| Pupils | Subject | Objective | Scores |
|---|---|---|---|
| Amina, Musa | Basic Science | `water_sources` — Water sources and uses | Amina 82/88/90; Musa 42/51/60 |
| Ngozi, Tunde | Basic Science | `plant_parts` — Plant parts and functions | Ngozi 62/70/78; Tunde 35/31/38 |
| Fatima, Emeka | Social Studies | `map_reading` — Map reading and directions | Fatima 80/84/86; Emeka 38/44/47 |
| Zainab, Ibrahim | Social Studies | `community` — Community responsibilities | Zainab 72/76/79; Ibrahim 55/52/58 |

IDs follow `assessment_<pupilId>_<1..3>`.

## 6. Teacher observations (progress entries)

Ten records with objective provenance. Each has `teacherNote`, `homeActivity`, approval state and revision.

| ID | Pupil | Objective | Indicator | Approval |
|---|---|---|---|---|
| `progress_amina_1` | Amina | water_sources | doing_well | approved |
| `progress_amina_2` | Amina | plant_parts | doing_well | approved |
| `progress_musa_1` | Musa | water_sources | developing | draft |
| `progress_musa_2` | Musa | plant_parts | developing | draft |
| `progress_ngozi_1` | Ngozi | plant_parts | developing | draft |
| `progress_tunde_1` | Tunde | plant_parts | needs_support | draft |
| `progress_fatima_1` | Fatima | map_reading | doing_well | approved |
| `progress_emeka_1` | Emeka | map_reading | needs_support | draft |
| `progress_zainab_1` | Zainab | community | doing_well | approved |
| `progress_ibrahim_1` | Ibrahim | community | developing | draft |

## 7. Follow-ups

| ID | Pupil | Source | Due | Status |
|---|---|---|---|---|
| `followup_musa_attendance` | Musa | attendance | 2026-11-30 | open |
| `followup_tunde_support` | Tunde | assessment | 2026-12-01 | open |
| `followup_emeka_map` | Emeka | observation | 2026-12-01 | open |
| `followup_fatima_digest` | Fatima | manual | 2026-11-28 | open |

## 8. Lessons

| ID | Class | Title | Status |
|---|---|---|---|
| `lesson_water` | P4 Blue | Sources and uses of water | ready |
| `lesson_plants` | P4 Blue | Plant parts and functions | ready |
| `lesson_map` | P5 Gold | Reading a simple map | ready |

Each plan has the full 5E structure plus materials. Graphic-organiser JSON and an evidence-informed lesson may be created from a class gap on either platform.

## 9. Parent communication

| Conversation | Pupil/guardian | Direction | Body |
|---|---|---|---|
| `conversation_amina` | Amina / Mrs. Bello | inbound | "Good morning. Amina will be a little late today." |
| `conversation_amina` | same | outbound | "Thank you for letting me know. I will mark Amina late." |
| `conversation_fatima` | Fatima / Mrs. Sani | outbound | "Fatima did well with map reading today." |

Messages are mock-provider records. Nothing is sent to a real phone number.

## 10. Derived intelligence (shared expected values)

Both engines implement the same deterministic thresholds. The same source records therefore produce:

| Pupil | Attendance | Assessment average | Status | Evidence confidence |
|---|---:|---:|---|---|
| Amina | 100% | 87% | strong | high |
| Musa | 43% | 51% | needs_attention (attendance) | high |
| Ngozi | 100% | 70% | improving (+12 points) | medium |
| Tunde | 71% | 35% | needs_attention (attendance + assessment) | medium |
| Fatima | 100% | 83% | strong | medium |
| Emeka | 71% | 43% | needs_attention (attendance + assessment) | medium |
| Zainab | 100% | 76% | strong | medium |
| Ibrahim | 100% | 55% | making_progress | medium |

P4 Blue: 4 pupils, 28 marked attendance entries, 79% class attendance, 61% assessment average. Common gap: `plant_parts`. Attention: Musa, Tunde. Improving: Ngozi.

P5 Gold: 4 pupils, 28 marked entries; common gap: `map_reading`; attention: Emeka.

Thresholds: attendance below 75%, assessment average below 45%, two or more `needs_support` observations, or insufficient records. Confidence is high only with at least 10 evidence records, 2 assessments and 2 observations; medium with at least 4 records; otherwise low. Improvement requires at least an 8-point assessment trend or a recent positive observation after support. "Strong" requires attendance ≥90%, assessment average ≥75% and no support observations. The teacher cannot make the status change by editing the label; only source records change it.

## 11. Reset and reseed

### Android

1. Open **Settings**.
2. Under **Sample workspace**, choose **Reset local sample data** and confirm.
3. The app clears Room and reseeds this exact dataset once.
4. Seeding is idempotent: opening a non-empty database never inserts a second copy.

Clearing Android app storage has the same effect. No network is required.

### Web

1. Open **Settings**.
2. Choose **Reset local demo** and confirm.
3. IndexedDB and the localStorage backup are cleared, then this dataset is written once.
4. In Firebase mode, **Sync centre → Reload remote** reads the canonical collections; it does not create duplicates.

### Automation

```bash
node tools/check-canonical-dataset.mjs
```

The guard compares the Android `DemoIds` and canonical literals with the web seed. It is a required CI step in both workflows.

## 12. What is intentionally not shared

- AI analyses are stored per device. They are diagnostics of the evidence on that device, not authoritative school records.
- Local drafts, sync attempts and audit events stay device-local.
- Real SMS delivery, real guardian consent and real pupil data are out of scope for the synthetic workspace.
