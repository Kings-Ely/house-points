<?php
require('./private/main.php');

queries(false, function ($query) {
    $studentID = $query(
        'SELECT id FROM users WHERE code = ?',
        's', $_GET['student']
    ) -> fetch_array(MYSQLI_ASSOC) ['id'];
    if (!$studentID) {
        die('invalid code');
    }

    $query(
        'INSERT INTO housepoints (student, description, quantity) VALUES (?, ?, ?)',
        'is', $studentID, $_GET['description'], $_GET['quantity']
    );

    echo 1;
});
