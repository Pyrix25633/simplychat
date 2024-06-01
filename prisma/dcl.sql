-- ! Modify .env to use root user when executing the 'npx prisma db push' command

CREATE USER 'SimplyChat'@'localhost' IDENTIFIED BY 'StrongPa$$word@2024';

GRANT SELECT, INSERT, DELETE ON TempUser TO 'SimplyChat'@'localhost';
GRANT SELECT, INSERT, UPDATE ON User TO 'SimplyChat'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON UsersOnChats TO 'SimplyChat'@'localhost';
GRANT SELECT, INSERT, UPDATE ON Chat TO 'SimplyChat'@'localhost';
GRANT SELECT, INSERT, UPDATE ON Message TO 'SimplyChat'@'localhost';