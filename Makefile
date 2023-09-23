.RECIPEPREFIX=>

default:
> systemctl start mysql
> npm start

install:
> npm install
> mkdir pfps
> touch pfps/test.svg
> mkdir chatLogos
> touch chatLogos/test.svg
> cp settings/template.json settings/settings.json
> nano settings/settings.json

fix-mysql:
> sudo chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

generate-certificates:
> sudo certbot certonly --standalone