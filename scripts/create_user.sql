CREATE USER `root`@`localhost` IDENTIFIED BY `CT-2722@Admin25633`;
GRANT ALL PRIVILEGES ON `opentasks`.`main` TO `root`@`localhost`;
GRANT ALL PRIVILEGES ON `opentasks`.`users` TO `root`@`localhost`;
GRANT ALL PRIVILEGES ON `opentasks`.`tasks` TO `root`@`localhost`;

flush privileges;