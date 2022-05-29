<?php
require('sql.php');

$code = $_GET['code'];

queries(function ($query) use ($code) {
    $res = $query('SELECT id, name, active FROM students WHERE code=?', 's', $code);
    $info = $res->fetch_array(MYSQLI_ASSOC);

    $info['hps'] = array();
    $res = $query('SELECT id, description, UNIX_TIMESTAMP(timestamp) as timestamp, UNIX_TIMESTAMP(accepted) as accepted, rejectMessage FROM housepoints WHERE student=?', 'i', $info['id']);
    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $info['hps'][] = $row;
    }

    echo json_encode($info);
});

