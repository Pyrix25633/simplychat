# SIMPLY CHAT

An Open-source Web Chat

Backend made with:
- Node.js
- TypeScript
- Express
- BodyParser
- Https
- Socket.io
- And more

Frontend made with:
- JavaScript
- HTML
- CSS
- AJAX
- Socket.io
- And more

## Installing the server

Run `make install`

## Creating the mysql database

Connect to mysql with `mysql -u <user> -p`, insert your password and then copy everything in scripts/create_schema.sql from `-- Start` to `-- End`, you can change `simplychat` with your database name

## Generating the HTTPS certificates with certbot

Run `make generate-certificates`

## Starting the server

Run `make`

## Fixing mysql not starting after update

Run `make fix-mysql`