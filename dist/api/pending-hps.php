<?php
require('./private/util.php');

require_admin();

queries(function ($query) {
    $res = $query(
        <<<'SQL'
            SELECT 
                housepoints.id as hpID, 
                housepoints.description,
                UNIX_TIMESTAMP(housepoints.created) as timestamp, 
                users.name as studentName,
                users.code as studentCode
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

