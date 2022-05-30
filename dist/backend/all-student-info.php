<?php
require('sql.php');

queries(function ($query) {
    $res = $query(<<<'SQL'
        SELECT 
            students.id, students.name, students.year,
            count(housepoints.accepted) as hps
        FROM students, housepoints
        WHERE
            housepoints.student = students.id
            AND housepoints.accepted IS NOT NULL
            AND housepoints.rejectMessage IS NULL
        GROUP BY students.id, students.name, students.year
        
        UNION
        
        SELECT
            students.id, students.name, students.year,
            0 as hps
        FROM students

        ORDER BY hps
SQL
    );

    $students = array();

    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $students[] = $row;
    }

    echo json_encode($students);
});

