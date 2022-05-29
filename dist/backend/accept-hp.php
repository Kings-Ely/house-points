<?php

require('sql.php');

queries(function ($query) {
    $id = $_GET['id'];
    $reject = $_GET['reject'];

    $query('UPDATE housepoints SET accepted=CURRENT_TIMESTAMP WHERE id=?', 'i', $id);

    if ($reject) {
        $query('UPDATE housepoints SET rejectMessage=? WHERE id=?', 'si', $reject, $id);
    }
});