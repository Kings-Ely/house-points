<?php

require('sql.php');

queries(function ($query) {
    $query('INSERT INTO housepoints (student, description) VALUES (?, ?)', 'is', $_GET['student'], $_GET['description']);
});