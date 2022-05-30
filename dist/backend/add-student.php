<?php

require('sql.php');
require('random.php');

$customAlphabet = 'abcdefghijklmnopqrstuvwxyz';
$tokenLength = 6;

queries(function ($query) use ($tokenLength, $customAlphabet) {

    $generator = new RandomStringGenerator($customAlphabet);
    $generator->setAlphabet($customAlphabet);
    $code = $generator->generate($tokenLength);

    $query('INSERT INTO students (name, code, year) VALUES (?, ?, ?)', 'ssi', $_GET['name'], $code, $_GET['year']);

    echo $code;
});