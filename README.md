# MeetVote

MeetVote ist eine Web-App zur Terminabstimmung:

- **Ersteller** melden sich an, erstellen und verwalten Umfragen.
- **Teilnehmer** stimmen weiterhin **ohne Login** nur per Link ab.

Das Projekt besteht aus:

- `backend/` -> Flask API + SQLite + SQLAlchemy ORM + JWT
- `my-app/` -> Next.js Frontend (App Router, Tailwind, shadcn/ui, Sonner)

---

## Features (aktueller Stand)

- Authentifizierung mit `register` / `login` (JWT)
- Passwort-Hashing mit `bcrypt` im Backend
- Umfragen erstellen nur für eingeloggte User
- Dashboard mit allen eigenen Umfragen
- Resultat-Tabelle im Dashboard (wie in der öffentlichen Poll-Ansicht)
- Öffentliche Abstimmung ohne Login über Token-Link
- Umfrage **schließen** (Link wird deaktiviert)
- Umfrage **löschen** (vollständig entfernen)
- Custom Confirm-Modal im Dashboard (kein Browser-`confirm`)

---

## Tech Stack

### Backend
- Python 3.11+
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- bcrypt
- SQLite

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons
- Sonner Toasts

---

## Projektstruktur

```text
meet_vote/
├─ backend/
│  └─ main.py
├─ my-app/
│  ├─ app/
│  │  ├─ create/page.tsx
│  │  ├─ dashboard/page.tsx
│  │  ├─ login/page.tsx
│  │  ├─ signup/page.tsx
│  │  └─ poll/[id]/page.tsx
│  ├─ components/
│  │  ├─ header-auth-controls.tsx
│  │  └─ vote-table.tsx
│  └─ package.json
└─ README.md
```

---

## Setup & Start

## 1) Backend starten

Im Projekt-Root:

```bash
python -m pip install flask flask-sqlalchemy flask-jwt-extended flask-cors bcrypt
python backend/main.py
```

Backend läuft danach auf:

- `http://127.0.0.1:5000`

Hinweis:
- Beim Start werden Tabellen automatisch erstellt.
- Eine Sample-Seed-Logik ist aktiv (Demo-Daten, falls noch nicht vorhanden).

---

## 2) Frontend starten

In neuem Terminal:

```bash
cd my-app
npm install
npm run dev
```

Frontend läuft standardmäßig auf:

- `http://localhost:3000`

Optional kannst du die API-URL setzen:

```bash
# in my-app/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
```

---

## Auth & Rollenlogik

- **Owner (eingeloggt):**
  - Umfragen erstellen
  - Eigene Umfragen im Dashboard sehen
  - Umfragen schließen/löschen
- **Teilnehmer (ohne Login):**
  - Poll über Public-Token öffnen
  - Stimme abgeben

---

## API Überblick

### Health
- `GET /health`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (JWT)

### Owner Poll Management (JWT)
- `POST /polls`
- `GET /polls/mine`
- `GET /polls/<poll_id>`
- `PUT /polls/<poll_id>`
- `DELETE /polls/<poll_id>`
- `POST /polls/<poll_id>/close`

### Public Voting (ohne Login)
- `GET /public/polls/<token>`
- `POST /public/polls/<token>/vote`

---

## Dashboard Aktionen

Im Dashboard pro Umfrage:

- **Offentliche Ansicht öffnen** -> öffnet Public-Link
- **Umfrage schließen** -> setzt Poll auf geschlossen, Public-Link liefert danach `404`
- **Umfrage löschen** -> entfernt Poll dauerhaft

Beide kritischen Aktionen laufen über ein eigenes Confirm-Modal.

---

## Typische Probleme

- **"Server nicht erreichbar" im Frontend**
  - Backend läuft nicht oder falsche API-URL
  - CORS-Origin passt nicht zum Frontend-Port

- **`401` im Dashboard**
  - JWT fehlt/abgelaufen -> neu einloggen

- **Public-Link funktioniert nicht mehr**
  - Poll wurde geschlossen oder gelöscht (erwartetes Verhalten)

---

## Lizenz

Dieses Projekt wurde im Rahmen einer Schul-/Ausbildungsarbeit erstellt.
Keine kommerzielle Nutzung ohne Zustimmung der Autoren.

