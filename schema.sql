-- This script will rebuild the MySQL database from the existing one of the same schema.
-- Comment out parts of the 'Clean database' section for if the schema is not the same,

-- -- -- -- Clean database -- -- -- --
-- not part of the schema
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE housepoints
    DROP FOREIGN KEY fk_hp_student_user;

ALTER TABLE awards
    DROP FOREIGN KEY fk_awards_type_awardTypes,
    DROP FOREIGN KEY fk_awards_student_user;

drop table housepoints;
drop table users;
drop table awards;
drop table awardTypes;

SET FOREIGN_KEY_CHECKS = 1;


-- -- -- -- Table structures -- -- -- --

CREATE TABLE `housepoints` (
    `id` int(11) NOT NULL,
    `student` int(11) NOT NULL,
    `description` text NOT NULL,
    `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `completed` timestamp NULL DEFAULT NULL,
    `status` enum('Pending', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Pending',
    `rejectMessage` text
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE `users` (
    `id` int(11) NOT NULL,
    `admin` TINYINT(1) NOT NULL DEFAULT 0,
    `name` text NOT NULL,
    `code` varchar(16) NOT NULL,
    `year` int(8) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE `awards` (
    `id` int(11) NOT NULL,
    `student` int(11) NOT NULL,
    `type` int(11) NOT NULL,
    `time` timestamp NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE `awardTypes` (
    `id` int(11) NOT NULL,
    `name` varchar(16),
    `hpsRequired` int(8)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;


-- -- -- -- Indexes -- -- -- --

ALTER TABLE `housepoints`
    ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `student-code` (`code`);

ALTER TABLE `awards`
    ADD PRIMARY KEY (`id`);

ALTER TABLE `awardTypes`
    ADD PRIMARY KEY (`id`);

-- -- -- -- 'AUTO_INCREMENT's -- -- -- --

ALTER TABLE `housepoints`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1000;

ALTER TABLE `users`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 10000;

ALTER TABLE `awards`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 100;

ALTER TABLE `awardTypes`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 0;

-- -- -- -- Foreign Keys -- -- -- --

ALTER TABLE `housepoints`
    ADD CONSTRAINT fk_hp_student_user FOREIGN KEY (student) REFERENCES users(id);

ALTER TABLE `awards`
    ADD CONSTRAINT fk_awards_type_awardTypes FOREIGN KEY (type) REFERENCES awardTypes(id),
    ADD CONSTRAINT fk_awards_student_user FOREIGN KEY (student) REFERENCES users(id);

