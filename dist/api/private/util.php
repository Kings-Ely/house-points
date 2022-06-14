<?php

// imports relative to file being used, so this file can only be used in api/*.php files

//* shows errors - possible security risk if uncommented
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
ini_set('display_errors', true);
error_reporting(E_ALL);
//*/

require('./private/sql.php');