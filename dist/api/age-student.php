<?php
require('./private/util.php');

queries(true, function ($query) {

    $query(
		'UPDATE users SET year = year + ? WHERE id=?',
		'ii', $_GET['amount'], $_GET['id']
    );

    echo '1';
});