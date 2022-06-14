<?php
require('./private/util.php');

queries(false, function ($query) {
    $tmpName = $_FILES['csv']['tmp_name'];
    $csvAsArray = array_map('str_getcsv', file($tmpName));

    echo json_encode($csvAsArray);
});

