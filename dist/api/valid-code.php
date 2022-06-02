<?php
require('./private/sql.php');

$code = $_GET['code'];

if ($code == $_ENV['ADMIN_PASS']) {
    echo '2';
} else {
    queries(function ($query) use ($code) {
        $res = $query('SELECT * FROM students WHERE code=?', 's', $code);
        echo !!$res->fetch_array(MYSQLI_NUM) ? '1' : '0';
    });
}