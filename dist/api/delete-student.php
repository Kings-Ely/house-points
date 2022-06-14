<?php
require('./private/util.php');

require_admin();

queries(function ($query) {

    $query('DELETE FROM users WHERE id = ?', 'i', $_GET['id']);
    $query('DELETE FROM housepoints WHERE student = ?', 'i', $_GET['id']);

    echo '1';
});