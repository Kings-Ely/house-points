<?php
require('./private/util.php');
require('./private/random.php');

$customAlphabet = 'abcdefghijklmnopqrstuvwxyz';
$tokenLength = 6;

queries(true, function ($query) use ($tokenLength, $customAlphabet) {

    $generator = new RandomStringGenerator($customAlphabet);
    $generator->setAlphabet($customAlphabet);
    $code = $generator->generate($tokenLength);

    $admin = $_GET['year'] == 0 ? 1 : 0;
    $student = $_GET['year'] == 0 ? 0 : 1;

    $query(
		'INSERT INTO users (name, code, year, admin, student) VALUES (?, ?, ?, ?, ?)',
		'ssiii', $_GET['name'], $code, $_GET['year'], $admin, $student
    );

    echo $code;
});