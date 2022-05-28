<?php

require('sql.php');

queries(function ($query) {
    $query('UPDATE housepoints SET accepted=CURRENT_TIMESTAMP WHERE id=?', 'i', $_GET['id']);
});