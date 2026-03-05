# Resume Bank Backend (MVP)

TypeScript + Fastify + Prisma + PostgreSQL backend for storing a user's structured resume inventory and exporting a normalized JSON bank.

## Stack

- Node.js + TypeScript
- Fastify
- PostgreSQL
- Prisma ORM (with SQL migrations)
- zod validation
- Dummy auth middleware (`req.user = { id: 1 }`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
# then edit .env and set DATABASE_URL
```

3. Run migrations:

```bash
npm run prisma:migrate
```

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. (Optional) Seed demo data for `user_id = 1`:

```bash
npm run seed
```

6. Start development server:

```bash
npm run dev
```

Server default: `http://localhost:3000`

## Scripts

- `npm run dev` - Run Fastify in watch mode
- `npm run build` - Compile TypeScript to `dist`
- `npm run start` - Run compiled server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run Prisma dev migration
- `npm run seed` - Seed sample data
- `npm run render:tex` - Call `POST /render` and write `./out/resume.tex`

## Endpoints

### Core CRUD sections

- `/education`
- `/experiences`
- `/projects`
- `/skills`
- `/interests`
- `/certificates`
- `/awards`
- `/leadership`
- `/profile`

Pattern for each section:

- `GET /section`
- `POST /section`
- `PUT /section/:id`
- `DELETE /section/:id`

Profile endpoints:

- `GET /profile`
- `POST /profile`
- `PUT /profile`
- `DELETE /profile`
- `POST /profile/links`
- `PUT /profile/links/:id`
- `DELETE /profile/links/:id`

### Bullet endpoints

- `POST /experiences/:id/bullets`
- `PUT /experiences/:id/bullets/:bulletId`
- `DELETE /experiences/:id/bullets/:bulletId`

- `POST /projects/:id/bullets`
- `PUT /projects/:id/bullets/:bulletId`
- `DELETE /projects/:id/bullets/:bulletId`

### Bank export

- `GET /bank/export`

Returns the full resume bank for `request.user.id` as one normalized payload. Empty sections return empty arrays/objects. Experiences and projects include nested `bullets` sorted by `order_index` ascending.

#### Sample curl

```bash
curl http://localhost:3000/bank/export
```

#### Truncated response example

```json
{
  "user": { "id": 1 },
  "profile": {
    "full_name": "Jane Doe",
    "location": "Indianapolis, IN",
    "phone": "+1-555-555-5555",
    "email": "jane@example.com",
    "headline": "Backend Engineer",
    "links": [
      { "label": "LinkedIn", "url": "https://linkedin.com/in/jane", "priority": 1 }
    ]
  },
  "education": [{ "id": "uuid", "school": "State University" }],
  "experiences": [
    {
      "id": "uuid",
      "title": "Software Engineer Intern",
      "bullets": [{ "id": "uuid", "order_index": 1, "bullet_long": "..." }]
    }
  ],
  "projects": [
    {
      "id": "uuid",
      "name": "Resume Bank",
      "bullets": [{ "id": "uuid", "order_index": 1, "bullet_long": "..." }]
    }
  ],
  "skills": { "groups": [{ "id": "uuid", "group_name": "Languages", "items": ["TypeScript"] }] },
  "interests": { "items": ["Hiking"] },
  "certificates": [{ "id": "uuid", "name": "AWS Certified Cloud Practitioner" }],
  "awards": [{ "id": "uuid", "title": "Hackathon Winner" }],
  "leadership": [{ "id": "uuid", "role": "Engineering Club President" }],
  "meta": {
    "exported_at": "2026-03-02T00:00:00.000Z",
    "schema_version": 1
  }
}
```

### LaTeX render

- `POST /render`

Request body:

```json
{
  "density": "normal",
  "sectionOrder": ["education", "experience", "projects", "certifications", "skills", "interests", "awards", "leadership"],
  "enabled": {
    "awards": true,
    "interests": false
  }
}
```

Response:

```json
{
  "latex": "\\documentclass[letterpaper,11pt]{article}..."
}
```

## cURL examples

### Create education

```bash
curl -X POST http://localhost:3000/education \
  -H 'Content-Type: application/json' \
  -d '{
    "school": "State University",
    "degree": "B.S. Computer Science",
    "majors": ["Computer Science"],
    "location": "Bloomington, IN",
    "start_date": "2020-08-15",
    "end_date": "2024-05-10",
    "relevant_coursework": ["Distributed Systems", "Databases"]
  }'
```

### Create experience

```bash
curl -X POST http://localhost:3000/experiences \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Software Engineer Intern",
    "company": "Acme",
    "location": "Remote",
    "start_date": "2023-06-01",
    "end_date": "2023-08-31",
    "employment_type": "INTERNSHIP",
    "tags": ["backend"],
    "tech_stack": ["TypeScript", "Fastify", "PostgreSQL"],
    "priority": 1
  }'
```

## Notes

- All records are owned by demo user `id = 1` via middleware.
- UUID primary keys are used on all entities except `users`.
- Validation errors and API errors return:

```json
{
  "error": {
    "message": "...",
    "details": {}
  }
}
```
