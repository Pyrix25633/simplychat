.RECIPEPREFIX=>

default:
> systemctl is-active --quiet mysql || systemctl start mysql
> npm start

almalinux:
> systemctl is-active --quiet mysqld || systemctl start mysqld
> npm start

compile-pages:
> cd pages && npx tsc -w

fix-mysql:
> sudo chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

generate-certificate:
> sudo iptables -t nat -F
> sudo certbot certonly --standalone
> sudo cp /etc/letsencrypt/live/simplychat.ddns.net/fullchain.pem ./certs/cert.pem
> sudo cp /etc/letsencrypt/live/simplychat.ddns.net/privkey.pem ./certs/key.pem
> make forward-ports

generate-selfsigned-certificate:
> mkdir -p ./certs
> openssl req -newkey rsa:4096 -x509 -sha512 -days 365 -nodes -out ./certs/cert.pem -keyout ./certs/key.pem

forward-ports:
> sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 4443
> sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080