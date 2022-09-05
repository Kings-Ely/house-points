SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------

CREATE TABLE `awards` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `awardTypeId` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `awarded` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `awardTypes` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `hpsRequired` int(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `events` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(2048) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `housepoints` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `eventId` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed` timestamp NULL DEFAULT NULL,
  `status` enum('Pending','Accepted','Rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `rejectMessage` mediumtext COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `logs` (
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `madeBy` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `msg` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `sessions` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opened` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires` int(128) NOT NULL DEFAULT '86400',
  `active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(320) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(256) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salt` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int(8) NOT NULL,
  `admin` tinyint(1) NOT NULL DEFAULT '0',
  `student` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin user - password is 'password'

INSERT INTO `users`
    (`id`, `email`, `password`, `salt`, `year`, `admin`, `student`) VALUES
(
     'admin',
     'admin@example.com',
     '6733b7ffeace4887c3b31258079c780d8db3018db9cbc05c500df3521f968df8',
     'abc',
     0,
     1,
     0
);

-- Add Primary Keys

ALTER TABLE `awards`      ADD PRIMARY KEY (`id`);
ALTER TABLE `awardTypes`  ADD PRIMARY KEY (`id`);
ALTER TABLE `events`      ADD PRIMARY KEY (`id`);
ALTER TABLE `housepoints` ADD PRIMARY KEY (`id`);
ALTER TABLE `sessions`    ADD PRIMARY KEY (`id`);
ALTER TABLE `users`       ADD PRIMARY KEY (`id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;