-- Seed a valid event and a user for local development

INSERT INTO "Event" ("title", "backgroundImageUrl", "logoImageUrl", "startsAt", "endsAt", "createdAt", "updatedAt")
SELECT
  'Driven.t',
  'https://files.driveneducation.com.br/images/logo-rounded.png',
  'linear-gradient(to right, #FA4098, #FFD77F)',
  NOW(),
  NOW() + INTERVAL '21 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Event" WHERE "title" = 'Driven.t');

INSERT INTO "User" ("email", "password", "createdAt", "updatedAt")
SELECT
  'user@drivent.com',
  '$2b$10$f/xCrgXb/JxxiSkSyH0b0Oky787L/uBszFy8EcjxEN2PnBTqK3NLG',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'user@drivent.com');
