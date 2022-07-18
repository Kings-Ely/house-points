<?php
require('./private/util.php');

/** ADMIN
 * GET add-hp.php: '1' | error
 *
 * ?studentid= ?number - the private id of student.
 *                       Either this or 'student' is required, priority on 'studentid'
 * ?student= ?string - the code of the student, required if 'studentid' is not present
 * ?description= string - the reason for getting the house point
 * ?quantity= number - the number of house points to award
 *
 * Immediately awards house points to a student. Must be admin.
 */

define('quantity', $_GET['quantity']);
define('description', $_GET['description']);

queries(true, function ($query) {
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
        'INSERT INTO housepoints (student, description, completed, status, quantity) VALUES (?, ?, CURRENT_TIMESTAMP, "Accepted", ?)',
        'is', $studentID, description, quantity
    );

    echo '1';
});
