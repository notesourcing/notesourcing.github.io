# Notesourcing Software Specification

**Questa webapp è progettata e configurata per essere distribuita come GitHub Page. Tutte le funzionalità sono client-side e la persistenza avviene tramite Firebase.**

Notesourcing is a collaborative platform for collecting, organizing, and sharing notes. It aims to serve a wide range of use cases - spiritual or meditative insights, educational resources, or even inventory tracking — while remaining simple and flexible for individuals and communities.

## 1. Core Features

### 1.1 Registration and Authentication

- Users can sign up using either a minimal form (user ID, email, password) or via OAuth providers (Google, GitHub, etc.).
- Optional additional fields such as name or date of birth can be supplied later.
- Two‑factor authentication (2FA) is supported for extra security.

### 1.2 Notes

- A note is a collection of key–value pairs called **fields**.
- Notes can include standard fields such as `Title`, `URL`, `Author`, `Public` (boolean) and `Created/Updated` timestamps.
- Users may edit any information on their own notes.
- Each note has a unique URL and a downloadable QR code for easy sharing.

### 1.3 Fields

- New fields can be created on the fly, or users can reuse existing ones suggested through autocomplete.
- A field is defined by:
  - **Name** – the identifier used in notes
  - **Data type** – string (default), integer, decimal, date, array, etc.
  - **Description** – short explanation of its purpose
  - Optional labels for different languages
  - Metadata for `similar fields` and `related fields`
- Field validation rules (e.g., regex patterns, min/max values) may be set.
- Field usage statistics help users discover popular fields.

### 1.4 Sharing and Permissions

- Notes are public by default but can be made private or shared with specific users or groups.
- Granular permissions allow view, edit, comment, and share rights for each note or field.
- Public sharing provides a link and QR code. Private notes can still generate a public link if desired.
- A note can be attributed to the user herself, to another person, to a pseudonym, an eteronym, or it can be anonymous. If using a pseudonym or eteronym, the user can choose to reveal that it is a pseudonym (or eteronym) or to use it as if it was the name of a person.
- The user can choose to share a note without revealing that it has been input by the user.
- On a note, each field can be chosen to be shared or private (accesible only the the user).

### 1.5 Comments and Versions

- Notes support threaded comments.
- A version history tracks changes for collaborative work.

## 2. Communities and Groups

- Users can create communities that may be public or private.
- Each community starts with a general group. Admins can create additional groups with their own privacy settings.
- Communities can host collections of notes and templates shared among members.

## 3. User Relationships and Interactions

- Users may link themselves to others with customizable relationship types (friend, coworker, collaborator, etc.).
- Interactions (e.g., "worked together on project X") can involve one or many users.
- Both parties may confirm relationships for verification, and privacy controls determine who can see them.

## 4. Templates and Pages

- Templates are predefined sets of fields for quicker note creation. They can be public, private, or restricted to a community.
- Page‑type notes allow lightweight formatting with Markdown (headers, lists, code blocks, tables, embedded media, and inline links to other notes).

## 5. Discovery

- The homepage displays recent and highlighted notes, usage stats, trending fields, and featured communities.
- Each note shows similar notes (using techniques like bag‑of‑words, TF‑IDF, or AI models) and relevant notes (based on user behavior, field overlap, social signals, etc.).
- A search function and field directory help users find existing fields and notes.

## 6. Security and Privacy

- OAuth login, optional 2FA, and privacy‑by‑default user profiles.
- Granular permissions on notes, fields, and communities.
- Audit logs for who viewed or edited content.
- Optional end‑to‑end encryption for sensitive communities.

## 7. Bulk Operations and API

- CSV import/export for batch creation or updates of notes.
- Batch operations for editing multiple notes at once.
- A public API allows external integrations and custom applications.

## 8. Monetization and Community Support

- The core platform is free, with voluntary donations encouraged on every page.
- Supporters receive a badge and can contribute ideas or join the development effort.

## 9. Web, Mobile and Cross‑Platform Access

- Web app.
- Mobile friendly so that the Web app can be used in mobile browsers in both iOS and Android.
- Serverless. For data persistence and user authentication, it should use Firebase.
- QR codes simplify sharing notes between devices.

## 10. Vision: A Social Knowledge Graph

- Notesourcing interconnects notes and users, forming a shared knowledge graph.
- Communities cultivate focused domains (e.g., meditation insights, business knowledge, inventory tracking), yet the underlying structure remains universal.
- By linking notes, fields, and users, Notesourcing enables collective intelligence across diverse topics while respecting each user's privacy choices.
