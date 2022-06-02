-- Table structure for table `housepoints`
CREATE TABLE `housepoints` (
   `id` int(11) NOT NULL,
   `student` int(11) NOT NULL,
   `description` text NOT NULL,
   `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `completed` timestamp NULL DEFAULT NULL,
   `status` enum('Pending', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Pending',
   `rejectMessage` text
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

-- Table structure for table `students`
CREATE TABLE `students` (
    `id` int(11) NOT NULL,
    `name` text NOT NULL,
    `code` varchar(16) NOT NULL,
    `year` int(16) NOT NULL DEFAULT '9'
) ENGINE = InnoDB DEFAULT CHARSET = latin1;


-- Indexes for table `housepoints`
ALTER TABLE `housepoints`
    ADD PRIMARY KEY (`id`);

-- Indexes for table `students`
ALTER TABLE `students`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `student-code` (`code`);


-- AUTO_INCREMENT for table `housepoints`
ALTER TABLE `housepoints`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 34;

-- AUTO_INCREMENT for table `students`
ALTER TABLE `students`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 10;