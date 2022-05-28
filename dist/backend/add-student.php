<?php

require('sql.php');

queries(function ($query) {
    $code = 'AAA';
    $query('INSERT INTO students (name, code) VALUES (?, ?)', 'ss', $_GET['name'], $code);
});