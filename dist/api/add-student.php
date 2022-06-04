<?php
require('./private/util.php');
require('./private/random.php');

require_admin();

$customAlphabet = 'abcdefghijklmnopqrstuvwxyz';
$tokenLength = 6;

queries(function ($query) use ($tokenLength, $customAlphabet) {

    $generator = new RandomStringGenerator($customAlphabet);
    $generator->setAlphabet($customAlphabet);
    $code = $generator->generate($tokenLength);

    $query('INSERT INTO students (name, code, year) VALUES (?, ?, ?)', 'ssi', $_GET['name'], $code, $_GET['year']);

    echo $code;
});