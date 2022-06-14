<?php
require('./private/util.php');

queries(true, function ($query) {
    $id = $_GET['id'];

    $query(
		'UPDATE housepoints SET completed = CURRENT_TIMESTAMP, status="Accepted" WHERE id=?',
		'i', $id
    );

    if (array_key_exists('reject', $_GET)) {
        $query(
			'UPDATE housepoints SET rejectMessage=?, status="Rejected" WHERE id=?',
			'si', $_GET['reject'], $id
        );
    }

    echo '1';
});