# Tiny — Curriculum and Localization Policy

## 1. Curriculum baseline

Tiny's initial curriculum reference is the current **NERDC Revised Basic Education Curriculum**, Primary 1 through Primary 6. The MVP includes only a small verified sample set; it must not pretend to cover the full curriculum before coverage is actually prepared and reviewed.

### 1.1 Source-control process

For every official source file used, record:

- NERDC source organization.
- Exact source title and grade/subject.
- Source URL and retrieval date.
- Edition/version/publication date if available.
- Copyright, permission or allowed-use note.
- File SHA-256 for reproducibility.
- Person who checked the content against the source.
- Curriculum pack version and date published in Tiny.

Do not scrape or reproduce whole textbooks or copyrighted teacher guides without an appropriate license. Store structured metadata and original Tiny-authored instructional templates. Any curriculum text reused must have confirmed reuse rights.

### 1.2 Content model

A curriculum item includes `gradeLevel`, `subjectId`, `topicId`, `objectiveId`, source reference, pack version and review status. A lesson plan references the curriculum objective IDs and adds teacher-created 5E activities.

The 5E structure is Tiny's lesson-planning scaffold, not a claim that the NERDC curriculum itself prescribes the 5E framework.

### 1.3 Seed content policy

- Seed a small number of fully verified examples for the demo and MVP.
- Choose exact Primary 1–6 subject/grade mappings from current official source files; never invent subject names or learning objectives.
- Clearly label unseeded areas as “not yet available” rather than showing empty/false curriculum coverage.
- Include source/version provenance on each pack.
- Allow app content packs to update when connected; existing saved lesson plans retain the source version used.
- Do not require internet to access already-downloaded pack content.

## 2. Launch languages

### Teacher application

- English: `en` (default).
- Hausa: `ha`.
- Yoruba: `yo`.
- Igbo: `ig`.

Every visible static UI string must use Android resource localization. Keep text out of hard-coded Compose literals except developer-only diagnostics. Language selection is per teacher profile and can be changed in settings.

### Parent SMS communication

- English: `en`.
- Hausa: `ha`.
- Yoruba: `yo`.
- Igbo: `ig`.
- Nigerian Pidgin: `pcm`.

Each guardian has an independent preferred locale. The same pupil may have different guardians who receive different language versions. Pidgin is a parent-communication locale in MVP, not a full teacher interface promise.

### Additional languages

The architecture must allow future locale packs for pilot communities (e.g. Tiv, Nupe, Gbagyi, Idoma, Kanuri, Fulfulde, Efik, Izon, Edo, Isoko, Urhobo, Jukun and others). These are candidates only; regional location is not a reliable substitute for a person's stated language preference. Never infer language from ethnicity, name or geographic assumption.

## 3. Translation and review

- Critical attendance, absence, opt-out, verification and privacy messages use human-reviewed fixed templates.
- A native/fluent reviewer must approve each locale version before real sending.
- AI may draft translations but cannot auto-publish or auto-send them.
- Keep template IDs and locale versions stable for audit; store template version with each message.
- Preserve pupil name token, school code, date, number and reply options exactly; unit test token substitution and encoding.
- Avoid idioms or complex phrasing; use short plain-language sentences.
- If a locale template is missing, do not silently send English. Use an explicitly configured fallback or ask the teacher/operator to resolve it.
- Parent free-text messages are stored in the received language; teacher may use cloud translation assistance only with privacy minimization and clear indication that a translation is machine-generated.

## 4. Curriculum medium and parent language distinction

Tiny's curriculum reference remains the official NERDC curriculum and the relevant approved instructional language policy. Multilingual Tiny UI and parent communication help teachers and parents understand and communicate; they do not replace official curriculum or school language-of-instruction obligations. Curriculum lessons may include teacher-authored local-language explanations as supplementary aids when appropriate and reviewed.

## 5. Hybrid AI language policy

Current Firebase/ML Kit on-device generation constraints mean Tiny must not claim on-device generation in all five parent languages. For MVP:

- On-device generative assistance: short, single-turn English tasks on a supported handset only.
- Cloud generation: English, Hausa, Yoruba, Igbo and Pidgin where model quality has been evaluated; online only.
- Offline fallback: curated reviewed resource/approved static translation. No model available means no model result, not an app failure.
- Any language that fails human quality review remains disabled for generated parent communication, while reviewed static templates remain available.

## 6. Test requirements

- Resource completeness test for every supported app UI locale.
- No unresolved resource key in release builds.
- Test diacritics and Unicode rendering for Hausa/Yoruba/Igbo.
- Test Unicode SMS encoding, per-segment character count and cost estimation for every parent locale.
- Test right-to-left? Not required for initial language set; architecture should avoid assumptions where feasible.
- Native reviewer approval recorded by locale/template version before production send.
- Verify parent can choose preferred language independently from another guardian on the same pupil record.
