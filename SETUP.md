# Supabase setup

The canonical database setup is [`supabase-setup.sql`](./supabase-setup.sql).

## Run it

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/eysamlflwidgvkitkonc/sql/new).
2. Create a new query.
3. Copy the **entire** contents of `supabase-setup.sql` into the editor.
4. Click **Run** once.

The script starts by deleting only this application's public tables and enum types. It then creates the schema and test data in one transaction. If any statement fails, PostgreSQL rolls back the entire setup instead of leaving a partial schema.

## Test accounts

| Role | Login | Password |
|---|---|---|
| Admin | `1234` | `1234` |
| Staff | `staff@eetoos.kr` | `1234` |
| Student | `12345` | `12345` |

## Verify

After the SQL Editor reports success, open:

<https://academy-reg.vercel.app/login>

The setup creates 15 offerings, 11 students, weekly sessions, pricing templates, and sample registrations so both student and staff timetables contain data.
