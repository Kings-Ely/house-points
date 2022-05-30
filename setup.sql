CREATE TABLE
    `josephcoppin_house_points`.`students`
(
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `code` VARCHAR(16) NOT NULL,
    PRIMARY KEY (`id`)
)
    ENGINE = InnoDB;

CREATE TABLE
    `josephcoppin_house_points`.`housepoints`
(
    `id` INT NOT NULL AUTO_INCREMENT ,
    `student` INT NOT NULL ,
    `description` TEXT NOT NULL ,
    `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
    PRIMARY KEY (`id`)
)
    ENGINE = InnoDB;

ALTER TABLE `students` ADD UNIQUE `student-code` (`code`);
ALTER TABLE `housepoints` ADD `accepted` TIMESTAMP NULL DEFAULT NULL AFTER `timestamp`;
ALTER TABLE `housepoints` ADD `rejectMessage` TEXT NULL DEFAULT NULL AFTER `accepted`;
ALTER TABLE `students` ADD `year` INT(16) NOT NULL DEFAULT '9' AFTER `code`;