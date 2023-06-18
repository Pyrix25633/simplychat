CREATE DATABASE simplychat;

USE simplychat;

CREATE TABLE ids (
    table_name VARCHAR(16) NOT NULL,
    next_id INT NOT NULL,
    PRIMARY KEY (table_name)
);

INSERT INTO ids VALUES ("users", 0);
INSERT INTO ids VALUES ("chats", 0);

CREATE TABLE users (
    id INT NOT NULL,
    username VARCHAR(32) NOT NULL,
    email VARCHAR(64) NULL,
    password_hash CHAR(128) NULL,
    token CHAR(128) NULL,
    token_expiration INT NULL,
    chat_ids JSON NOT NULL,
    online BOOLEAN NOT NULL,
    last_online INT NOT NULL,
    status VARCHAR(64) NOT NULL,
    settings JSON NULL,
    pfp_type VARCHAR(5) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE temp_users (
    username VARCHAR(32) NOT NULL,
    email VARCHAR(64) NOT NULL,
    password_hash CHAR(128) NOT NULL,
    verification_code INT NOT NULL,
    timestamp INT NOT NULL,
    PRIMARY KEY (username)
);

CREATE TABLE chats (
    id INT NOT NULL,
    name VARCHAR(64) NOT NULL,
    users JSON NOT NULL,
    description VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE chat<id> (
    id INT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    user_id INT NOT NULL,
    message VARCHAR(2048) NOT NULL,
    modified BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);