<?php
require('./private/main.php');

/** ADMIN
 * GET age-student.php: '1' | error
 *
 * ?amount= number - the number of years to change by. Can be positive or negative.
 * ?id= number - the id of the student to change years
 *
 * Changes the year of the student by an amount
 */

define("id", $_GET['id']);
define("amount", $_GET['amount']);

queries(true, function ($query) {

    $query(
		'UPDATE users SET year = year + ? WHERE id=?',
		'ii', amount, id
    );

    echo '1';
});
