<?php
require('./private/util.php');

$code = $_GET['code'];

queries(false, function ($query) use ($code) {
    $res = $query(
		'SELECT admin FROM users WHERE code = ?',
		's', $code
    );
    $row = $res->fetch_array(MYSQLI_ASSOC);

	if (!$row) {
		echo '0';
	} else if ($row['admin'] == 1) {
		echo '2';
	} else {
		echo '0';
	}
});