<?php
require('sql.php');

queries(function ($query) {
    $res = $query('SELECT * FROM students WHERE code=?', 's', $_GET['code']);
    echo !!$res->fetch_array(MYSQLI_NUM) ? '1' : '0';
});