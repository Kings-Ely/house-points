-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 23, 2022 at 09:32 PM
-- Server version: 5.7.38
-- PHP Version: 7.4.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `josephcoppin_house_points`
--

-- --------------------------------------------------------

--
-- Table structure for table `awards`
--

CREATE TABLE `awards` (
                          `id` int(11) NOT NULL,
                          `student` int(11) NOT NULL,
                          `type` int(11) NOT NULL,
                          `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          `awarded` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `awardTypes`
--

CREATE TABLE `awardTypes` (
                              `id` int(11) NOT NULL,
                              `name` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                              `hpsRequired` int(8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
                          `id` int(11) NOT NULL,
                          `name` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                          `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `housepoints`
--

CREATE TABLE `housepoints` (
                               `id` int(11) NOT NULL,
                               `student` int(11) NOT NULL,
                               `quantity` int(11) NOT NULL DEFAULT '1',
                               `event` int(11) DEFAULT NULL,
                               `description` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
                               `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               `completed` timestamp NULL DEFAULT NULL,
                               `status` enum('Pending','Accepted','Rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
                               `rejectMessage` mediumtext COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
                         `id` int(11) NOT NULL,
                         `admin` tinyint(1) NOT NULL DEFAULT '0',
                         `student` tinyint(1) NOT NULL DEFAULT '1',
                         `name` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
                         `code` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
                         `year` int(8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `admin`, `student`, `name`, `code`, `year`) VALUES
                                                                           (10001, 1, 0, 'Admin', 'admin', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `awards`
--
ALTER TABLE `awards`
    ADD PRIMARY KEY (`id`),
    ADD KEY `fk_awards_type_awardTypes` (`type`),
    ADD KEY `fk_awards_student_user` (`student`);

--
-- Indexes for table `awardTypes`
--
ALTER TABLE `awardTypes`
    ADD PRIMARY KEY (`id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
    ADD PRIMARY KEY (`id`);

--
-- Indexes for table `housepoints`
--
ALTER TABLE `housepoints`
    ADD PRIMARY KEY (`id`),
    ADD KEY `fk_hp_student_user` (`student`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `student-code` (`code`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `awards`
--
ALTER TABLE `awards`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `awardTypes`
--
ALTER TABLE `awardTypes`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20000;

--
-- AUTO_INCREMENT for table `housepoints`
--
ALTER TABLE `housepoints`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1002;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10004;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `awards`
--
ALTER TABLE `awards`
    ADD CONSTRAINT `fk_awards_student_user` FOREIGN KEY (`student`) REFERENCES `users` (`id`),
    ADD CONSTRAINT `fk_awards_type_awardTypes` FOREIGN KEY (`type`) REFERENCES `awardTypes` (`id`);

--
-- Constraints for table `housepoints`
--
ALTER TABLE `housepoints`
    ADD CONSTRAINT `fk_hp_student_user` FOREIGN KEY (`student`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
