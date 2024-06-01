# SIMPLY CHAT

An Open Source Web Chat

Backend made with:
- Node
- TypeScript
- Express
- BodyParser
- Https
- Socket.io
- Prisma
- NodeMailer

Frontend made with:
- TypeScript
- HTML
- CSS
- AJAX
- Socket.io
- Chart.io

## Installation Process

1. Install MySql Server
2. Install npm (can be done using nvm)
3. Run `npm i`
4. Edit `.env` to use Root User and execute `npx prisma db push`
5. Copy and paste Commands contained in `prisma/dcl.sql` an run them as Root inside the MySql Terminal
6. Edit `.env` to use to newly created user
7. Generate the SSL/TLS certificate with `make generate-certificate` or `make generate-selfsigned-certificate`
9. Modify `lib/settings.ts` to match your Requirements

## Start the Server

Run `make` or `make almalinux` if MySql service is called `mysqld` instead of `mysql`

## Fix MySql not starting after Update

Run `make fix-mysql`

## Links

- [API Documentation](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/Pyrix25633/simplychat/main/api.yml)
- [Patreon](https://www.patreon.com/Pyrix25633ModsandSoftware)