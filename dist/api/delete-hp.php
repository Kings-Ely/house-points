<?php
require('./private/util.php');

queries(false, function ($query) {
    $query(
		'DELETE FROM housepoints WHERE id = ?',
		'i', $_GET['id']
    );
    echo '1';
});