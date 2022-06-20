<?php

require('./private/util.php');

queries(true, function ($query) {
    $res = $query(<<<'SQL'
		SELECT users.id, users.name, users.year, users.code, users.admin, users.student,
			SUM(CASE WHEN housepoints.status="Pending" THEN housepoints.quantity ELSE 0 END) AS pending,
			SUM(CASE WHEN housepoints.status="Accepted" THEN housepoints.quantity ELSE 0 END) AS accepted,
			SUM(CASE WHEN housepoints.status="Rejected" THEN housepoints.quantity ELSE 0 END) AS rejected
		FROM users LEFT JOIN housepoints
		ON housepoints.student = users.id
		GROUP BY users.id, users.name, users.year, users.code
		ORDER BY users.student ASC, users.admin DESC, year ASC, name ASC;
SQL
    );

    $students = array();

    while ($row = $res->fetch_array(MYSQLI_ASSOC)) {
        $students[] = $row;
    }

    echo json_encode($students);
});

