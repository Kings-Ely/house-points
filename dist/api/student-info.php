<?php
require('./private/main.php');

$code = $_GET['code'];

queries(false, function ($query) use ($code) {
    $res = $query(
		'SELECT id, name, year, admin, student FROM users WHERE code = ?',
		's', $code
    );
    $info = $res->fetch_array(MYSQLI_ASSOC);

    if (!$info) {
        die('{}');
    }

    $info['hps'] = array();
    $res = $query(<<<'SQL'
        SELECT id, description, status,
			UNIX_TIMESTAMP(created) as timestamp,
			UNIX_TIMESTAMP(completed) as accepted,
			rejectMessage
        	quantity
        FROM housepoints
        WHERE student = ?
        ORDER BY timestamp DESC
SQL
        , 'i', $info['id']);
    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $info['hps'][] = $row;
    }

    echo json_encode($info);
});
