<?php
require('sql.php');

queries(function ($query) {
    $res = $query(
        <<<'SQL'
            SELECT 
                housepoints.id as hpID, 
                housepoints.description,
                UNIX_TIMESTAMP(housepoints.timestamp) as timestamp, 
                students.name as studentName,
                students.code as studentCode
            FROM housepoints, students
            WHERE 
                housepoints.accepted IS NULL AND
                housepoints.student = students.id
            ORDER BY timestamp DESC
SQL
    );

    $info = array();
    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $info[] = $row;
    }
    echo json_encode($info);
});

