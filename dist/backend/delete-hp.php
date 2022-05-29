<?php

require('sql.php');

queries(function ($query) {
    $query('DELETE FROM housepoints WHERE id=?', 'i', $_GET['id']);
});