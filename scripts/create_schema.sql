CREATE DATABASE simplychat;

CREATE TABLE simplychat.users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(32) NOT NULL,
    email VARCHAR(64) NULL,
    password_hash CHAR(128) NULL,
    chat_ids JSON NULL,
    online BOOLEAN NOT NULL,
    last_online INT NOT NULL,
    status VARCHAR(64) NOT NULL,
    settings JSON NULL,
    PRIMARY KEY (id)
);

CREATE TABLE simplychat.temp_users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(32) NOT NULL,
    email VARCHAR(64) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    verification_code INT NOT NULL,
    timestamp INT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE simplychat.tokens (
    token CHAR(128) NOT NULL,
    user_id INT NOT NULL,
    timestamp INT NOT NULL,
    PRIMARY KEY (token),
    FOREIGN KEY (user_id) REFERENCES simplychat.users(id)
);

CREATE TABLE simplychat.chats (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL,
    users JSON NOT NULL,
    description VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE simplychat.chat<id> (
    id INT NOT NULL AUTO_INCREMENT,
    timestamp TIMESTAMP NOT NULL,
    user_id INT NOT NULL,
    message VARCHAR(2048) NOT NULL,
    modified BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES simplychat.users(id)
);