<?php
require('./private/main.php');
require('./private/random.php');

/** ADMIN
 * GET add-user.php: string - code of new student
 *
 * ?year= number[9-13] - year group
 * ?name= string - what they should be identified by
 *
 * Creates a user
 */

const tokenLength = 6;

define("year", array_key_exists('year', $_GET) ? intval($_GET['year']) : 9);
define("name", array_key_exists('name', $_GET) ? $_GET['name'] : '');

queries(true, function ($query) {

    $generator = new RandomStringGenerator(lowerAlphabet);
    $code = $generator->generate(tokenLength);

    // year 9 is default, although it should never fall back to that in practise

    if (!name) {
        die('Name required to create user');
    }

    $admin = year == 0 ? 1 : 0;
    $student = year == 0 ? 0 : 1;

    $query(
		'INSERT INTO users (name, code, year, admin, student) VALUES (?, ?, ?, ?, ?)',
		'ssiii', name, $code, year, $admin, $student
    );

    echo $code;
});
