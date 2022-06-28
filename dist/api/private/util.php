<?php

// imports relative to file being used, so this file can only be used in api/*.php files

/* shows errors - possible security risk if uncommented
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
ini_set('display_errors', true);
error_reporting(E_ALL);
//*/

//* Logs errors to file

ini_set("log_errors", 1);
ini_set("error_log", "./error.log");
error_log( "Hello, errors!" );

//*/


// as this should be a public API, allow anyone to connect to it
header('Access-Control-Allow-Origin: *');

require('./private/sql.php');