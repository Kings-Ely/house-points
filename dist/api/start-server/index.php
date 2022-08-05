<?php

// Can't check user auth as the server is down :/
// could connect to the DB in PHP and check if the user is logged in

/* For debugging:
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
ini_set('display_errors', true);
error_reporting(E_ALL);
//*/

$containerName = 'house-points-api-container';
$serverPath = '~/hpsnea-server';

if (strlen(`docker ps | grep $containerName`) < 2) {
    `cd $serverPath; npm run start`;
    echo 1;
} else {
    echo 0;
}
