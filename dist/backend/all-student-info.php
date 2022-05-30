<?php
require('sql.php');

queries(function ($query) {
    $res = $query(<<<'SQL'
        SELECT 
            students.id, students.name, students.year, students.code,
            count(housepoints.accepted) as hps
        FROM students, housepoints
        WHERE
            housepoints.student = students.id
            AND housepoints.accepted IS NOT NULL
            AND housepoints.rejectMessage IS NULL
        GROUP BY students.id, students.name, students.year
        
        UNION
        
        SELECT id, name, year, code, 0 as hps
        FROM students
        
        ORDER BY year ASC, name ASC
SQL
    );

    $students = array();

    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $students[] = $row;
    }

    echo json_encode($students);
});

