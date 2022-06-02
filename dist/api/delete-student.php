<?php
require('./private/sql.php');

queries(function ($query) {

    $query('DELETE FROM students WHERE id=?', 'i', $_GET['id']);
    $query('DELETE FROM housepoints WHERE student=?', 'i', $_GET['id']);

    echo '1';
});