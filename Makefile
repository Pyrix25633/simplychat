.RECIPEPREFIX=>

default:
> systemctl is-active --quiet mysql || systemctl start mysql
> npm start

install:
> npm install
> mkdir pfps
> touch pfps/test.svg
> mkdir chatLogos
> touch chatLogos/test.svg
> cp settings/template.json settings/settings.json
> nano settings/settings.json

compile-pages:
> cd pages && npx tsc -w

fix-mysql:
> sudo chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

generate-certificate:
> sudo certbot certonly --standalone

generate-selfsigned-certificate:
> mkdir -p ./certs
> openssl req -newkey rsa:4096 -x509 -sha512 -days 365 -nodes -out ./certs/cert.pem -keyout ./certs/key.pem