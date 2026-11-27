# Tiny demo narration script

Target: 90–150s; rendered: 146.6s

## Scenes

### 01. Tiny  -  teacher preview

Tiny is an offline-first teacher tool for rural primary schools. Teachers use their Android phone. Parents use ordinary SMS, and pupils have no account or app.

### 02. Language

Teachers can choose English, Hausa, Yoruba, or Igbo. Non-English strings are drafts with English fallback until review.

### 03. Firebase verified

Auth and Firestore are verified on a non-production project. A synthetic teacher signs in and loads a synthetic workspace. SMS stays mocked.

### 04. Home

The home screen shows today's classes, pending sync, parent messages, and the next useful action.

### 05. Classes

Manage more than one class, open a roster, and add a class or pupil locally.

### 06. Offline attendance

Attendance works offline. Mark every active pupil, review the register, and submit locally. Only absences create an immediate notification job after server acceptance.

### 07. 5E lessons

A saved 5E lesson opens offline. It is a teacher-authored scaffold, not full NERDC coverage.

### 08. Optional AI

AI is optional. On this emulator, Gemini Nano is unavailable. The SDK falls back to cloud AI and reports its source; here it says Cloud Gemini. Curated strategies still work offline, and the core lesson never depends on a model.

### 09. Parent SMS

Parent messages arrive through the SMS adapter. In this preview it is mocked, so nothing leaves the device.

### 10. Teacher reply

A teacher can reply from Tiny without exposing a personal phone number. Provider acceptance is not the same as delivery.

### 11. Family contacts

A pupil can have more than one guardian. Verify an endpoint in person and record opt-in before any child-specific SMS. A shared family contact is reused for siblings.

### 12. The next gates

Tiny is not finished. Remaining gates are App Distribution, App Check enforcement and Play Integrity, native translation review, and a supported on-device AI device. Big impact. Small requirements. Accessible everywhere.
