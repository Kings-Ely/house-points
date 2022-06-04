<?php
require('./private/util.php');

$code = $_GET['code'];

queries(function ($query) use ($code) {
    $res = $query('SELECT id, name FROM students WHERE code = ?', 's', $code);
    $info = $res->fetch_array(MYSQLI_ASSOC);

    $info['hps'] = array();
    $res = $query(<<<'SQL'
        SELECT id, description, status,
           UNIX_TIMESTAMP(created) as timestamp,
           UNIX_TIMESTAMP(completed) as accepted,
           rejectMessage 
        FROM housepoints
        WHERE student=?
        ORDER BY timestamp DESC
SQL
        , 'i', $info['id']);
    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $info['hps'][] = $row;
    }

    echo json_encode($info);
});

