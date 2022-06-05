<?php
require('./private/util.php');

queries(function ($query) {
    $res = $query(<<<'SQL'
        SELECT students.name, students.year,
               SUM(CASE WHEN housepoints.status="Accepted" THEN 1 ELSE 0 END) AS housepoints
       FROM students LEFT JOIN housepoints
       ON housepoints.student = students.id
       GROUP BY students.name, students.year
       ORDER BY housepoints DESC, year DESC, name ASC;
SQL
    );

    $students = array();

    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $students[] = $row;
    }

    echo json_encode($students);
});

