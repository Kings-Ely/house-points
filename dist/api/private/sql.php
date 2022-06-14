<?php
// imports relative to file being used, so this file can only be used in api/*.php files
require('./private/env.php');

// custom api for making queries to database with a callback
/*
 * Example:
 *
queries(function ($query) {
    $query('SELECT * FROM something WHERE id = ?', 'i', 1);
});

 *
 * Does SQL injection prevention of parameters.
 * Closes connection after use.
 */
function queries ($require_admin, $cb) {
	// DB credentials
    $servername = "localhost";
    $username = getenv('DB_USER');
    $password = getenv('DB_PASS');
    $db = getenv('DB');

    // Create connection
    $con = new mysqli($servername, $username, $password, $db);

    // Check connection
    if ($con->connect_error) {
        die("Connection to database failed: " . $con->connect_error);
    }


    $dbQuery = function ($query, $d_types=null, &...$parameters) use ($con) {

        $stmt = $con->prepare($query);
        if (!$stmt) {
            die('Failed to execute statement');
        }

        if ($d_types) {
            if (!$stmt->bind_param($d_types, ...$parameters)) {
                die('failed to bind parameters');
            }
        }

        if (!$stmt->execute()) {
            die('failed to execute sql query');
        }

        return $stmt->get_result();
    };

    if ($require_admin) {
        $res = $dbQuery(
            'SELECT admin FROM users WHERE code = ?',
            's', $_GET['myCode']
        );
        $row = $res->fetch_array(MYSQLI_ASSOC);
        if (!$row) {
            die('0');
        } else if ($row['admin'] != 1) {
            die('0');
        }
    }

    $cb($dbQuery);

    $con->close();
}

