<?php

require('sql.php');

if ($_GET['id'] != $_ENV['ADMIN_PASS']) {
    die('0');
}

queries(function ($query) {
    $studentID = 0;
    if (array_key_exists('studentid', $_GET)) {
        $studentID = $_GET['studentid'];

    } else {
        $studentID = $query(
            'SELECT id FROM students WHERE code=?',
            's',
            $_GET['student']
        ) -> fetch_array(MYSQLI_ASSOC) ['id'];
    }

    if (!$studentID) {
        die('invalid code');
    }

    $query(
        'INSERT INTO housepoints (student, description, completed, status) VALUES (?, ?, CURRENT_TIMESTAMP, "Accepted")',
        'is', $studentID, $_GET['description']
    );

    echo '1';
});