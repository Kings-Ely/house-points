<?php
require('sql.php');

queries(function ($query) {
    $res = $query(<<<'SQL'
        SELECT students.id, students.name, students.year, students.code,
               SUM(CASE WHEN housepoints.status="Pending" THEN 1 ELSE 0 END) AS pending,
               SUM(CASE WHEN housepoints.status="Accepted" THEN 1 ELSE 0 END) AS accepted,
               SUM(CASE WHEN housepoints.status="Rejected" THEN 1 ELSE 0 END) AS rejected
           FROM students LEFT JOIN housepoints
           ON housepoints.student = students.id
           GROUP BY students.id, students.name, students.year, students.code
           ORDER BY year ASC, name ASC;
SQL
    );

    $students = array();

    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $students[] = $row;
    }

    echo json_encode($students);
});

