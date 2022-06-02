<?php
require('./private/sql.php');

queries(function ($query) {

    $query('UPDATE students SET year = year + ? WHERE id=?', 'ii', $_GET['amount'], $_GET['id']);

    echo '1';
});