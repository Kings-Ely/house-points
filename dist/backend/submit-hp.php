<?php

require('sql.php');

queries(function ($query) {
    $studentID = $query(
        'SELECT id FROM students WHERE code=?',
        's',
        $_GET['student']
    ) -> fetch_array(MYSQLI_ASSOC) ['id'];
    if (!$studentID) {
        die('invalid code');
    }

    $query(
        'INSERT INTO housepoints (student, description) VALUES (?, ?)',
        'is', $studentID, $_GET['description']
    );
});