--Start

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
    token_duration INT NULL,
    tfa_key CHAR(52) NULL,
    chats JSON NOT NULL,
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
    description VARCHAR(128) NOT NULL,
    token CHAR(128) NOT NULL,
    token_expiration INT NULL,
    default_permission_level INT NOT NULL,
    chat_logo_type VARCHAR(5) NOT NULL,
    PRIMARY KEY (id)
);

-- End

CREATE TABLE chat<id> (
    id INT NOT NULL,
    timestamp INT NOT NULL,
    user_id INT NOT NULL,
    message BLOB NOT NULL,
    edited BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);