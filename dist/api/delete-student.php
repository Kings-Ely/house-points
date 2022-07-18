<?php
require('./private/util.php');

define("id", $_GET['id']);

queries(true, function ($query) {

    $query('DELETE FROM users WHERE id = ?', 'i', id);
    $query('DELETE FROM housepoints WHERE student = ?', 'i', id);

    echo '1';
});
