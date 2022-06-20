<?php
require('./private/util.php');

queries(true, function ($query) {
    $res = $query(
        <<<'SQL'
            SELECT 
                housepoints.id as hpID, 
                housepoints.description,
                UNIX_TIMESTAMP(housepoints.created) as timestamp, 
                users.name as studentName,
                users.code as studentCode,
                housepoints.quantity
            FROM housepoints, users
            WHERE 
                housepoints.status = "Pending" AND
                housepoints.student = users.id
            ORDER BY timestamp DESC
SQL
    );

    $info = array();
    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $info[] = $row;
    }
    echo json_encode($info);
});

