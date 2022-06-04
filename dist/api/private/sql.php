<?php
// imports relative to file being used, so this file can only be used in api/*.php files
require('./private/env.php');

//* shows errors
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
ini_set('display_errors', true);
error_reporting(E_ALL);
//*/

function queries ($cb) {
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

    $cb(function ($query, $d_types=null, &...$parameters) use ($con) {

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
    });

    $con->close();
}

