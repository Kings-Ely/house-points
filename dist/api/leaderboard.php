<?php
require('./private/util.php');

queries(function ($query) {
    $res = $query(<<<'SQL'
        SELECT users.name, users.year,
               SUM(CASE WHEN housepoints.status="Accepted" THEN 1 ELSE 0 END) AS housepoints
       FROM students LEFT JOIN housepoints
       ON housepoints.student = users.id
       GROUP BY users.name, users.year
       ORDER BY housepoints DESC, year DESC, name ASC;
SQL
    );

    $students = array();

    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $students[] = $row;
    }

    echo json_encode($students);
});

