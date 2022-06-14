<?php
require('./private/util.php');

require_admin();

queries(function ($query) {
    if (array_key_exists('studentid', $_GET)) {
        $studentID = $_GET['studentid'];

    } else {
        $studentID = $query(
            'SELECT id FROM users WHERE code = ?',
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