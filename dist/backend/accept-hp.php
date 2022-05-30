<?php

require('sql.php');

queries(function ($query) {
    $id = $_GET['id'];

    $query('UPDATE housepoints SET accepted=CURRENT_TIMESTAMP WHERE id=?', 'i', $id);

    if (array_key_exists('reject', $_GET)) {
        $query('UPDATE housepoints SET rejectMessage=? WHERE id=?', 'si', $_GET['reject'], $id);
    }

    echo '1';
});