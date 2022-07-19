<?php
require('./private/main.php');

queries(false, function ($query) {
    $res = $query(<<<'SQL'
		SELECT users.name, users.year,
			SUM(
			    CASE 
			        WHEN housepoints.status="Accepted" 
			        THEN housepoints.quantity ELSE 0
		        END
		    ) AS housepoints
		FROM users LEFT JOIN housepoints
		ON housepoints.student = users.id
		WHERE users.student = true
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
