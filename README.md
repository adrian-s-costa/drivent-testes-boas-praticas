# drivent-back

Back-end for Driven.t, an event management solution.

:)

## About

Driven.t is a web browser application with which you can manage every single aspect of your event.

### Features

- Event management API
- Redis caching for improved performance on event endpoints
  - Optional caching via `allow-cache` header
  - 5-minute TTL
  - Write-through cache updates
  - See [REDIS_SETUP.md](REDIS_SETUP.md) for details

## How to run for development

1. Clone this repository
2. Install all dependencies

```bash
npm i
```

3. Create a PostgreSQL database with whatever name you want
4. Configure the `.env.development` file using the `.env.example` file (see "Running application locally or inside docker section" for details)
5. Run all migrations

```bash
npm run migration:run
```

6. Seed db

```bash
npm run dev:seed
```

6. Run the back-end in a development environment:

```bash
npm run dev
```

## How to run tests

1. Follow the steps in the last section
1. Configure the `.env.test` file using the `.env.example` file (see "Running application locally or inside docker" section for details)
1. Run all migrations

```bash
npm run migration:run
```

3. Run test:
   (locally)

```bash
npm run test
```

(docker)

```bash
npm run test:docker
```

## Building and starting for production

```bash
npm run build
npm start
```

## Running migrations or generate prisma clients

Before running migrations make sure you have a postgres db running based on `.env.development` or `.env.test` file for each environment. You can start a postgres instance by typing `npm run dev:postgres` or `npm run test:postgres`. The host name is the name of the postgres container inside docker-compose file if you are running the application inside a docker container or localhost if you are running it locally.

You can operate on databases for different environments, but it is necessary to populate correct env variables for each environment first, so in order to perform db operations type the following commands:

- `npm run dev:migration:run` - run migrations for development environment by loading envs from .env.development file. It uses [dotenv-cli](https://github.com/entropitor/dotenv-cli#readme) to load envs from .env.development file.
- `npm run test:migration:run` - the same, but for test environment

- `npm run dev:migration:generate -- --name ATOMIC_OPERATION_NAME` - generate and run migration and prisma client for development environment by loading envs from .env.development file. Replace `ATOMIC_OPERATION_NAME` by the name of the migration you want to generate.

## Switching between environments

In order to switch between development and test environments you need to shutdown the current postgres instance if it is running and start the new one.

If you are in development environment:

```bash
npm run dev:postgres:down
```

And then

```bash
npm run test:postgres
```

If you are in test environment:

```bash
npm run test:postgres:down
```

And then

```bash
npm run dev:postgres
```

## Running application locally or inside docker

`.env.development` and `.env.test` must be changed if you and to run the application locally or inside docker. You can populate files based on `.env.example` file, but you need to consider the following:

- Running application locally (postgres, redis and node):

Add your postgres credentials and make sure to create given database before running the application. Also ensure Redis is running locally or via Docker.

- Running application inside docker (postgres, redis and node):

Set `POSTGRES_HOST` to `drivent-postgres-development` for `.env.development` and `drivent-postgres-test` for `.env.test` file. Set `REDIS_HOST` to `drivent-redis-test`. Docker Compose will start the postgres and redis containers for you, create the database and host alias for you.

- Running application locally (node) but postgres and redis are running inside docker:

Set `POSTGRES_HOST` to `localhost` and `REDIS_HOST` to `localhost` for both `.env.development` and `.env.test` files. Docker compose is configured to expose postgres and redis containers to your localhost.

**Starting Docker services:**
```bash
docker compose up -d
```

This will start PostgreSQL (port 5433) and Redis (port 6379).

## What to do when add new ENV VARIABLES

There are several things you need to do when you add new ENV VARIABLES:
- Add them to `.env.example` file
- Add them to your local `.env.development` and `.env.test` files
- Add them to your docker-compose.yml file (just the name, not the value). Only envs listed in the environment section will be exposed to your docker container.
- Add them (prod version) to your github repo secrets. They will be used to generate the `.env` file on deploy.
- Add them (prod version) to test.yml file on .github/workflows/test.yml.
