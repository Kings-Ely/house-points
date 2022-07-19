<?php
require '../main.php';

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':

        queries(false, function ($query) {

            if (array_key_exists('id', $_GET)) {
                $res = $query(
                    "SELECT * FROM housepoints WHERE id = ?",
                    'i', $_GET['id']);
                echo json_encode($res);

            } else if (array_key_exists('code', $_GET)) {
                $id = user_from_code($_GET['code'], $query);
                $res = $query(
                    "SELECT * FROM housepoints WHERE student = ?",
                    'i', $id);
                echo json_encode($res);

            } else if (array_key_exists('year', $_GET)) {

                $years = explode('-', $_GET['year']);
                $numYears = count($years);

                $res = $query(
                    "
                        SELECT 
                            housepoints.id, 
                            users.name, 
                            housepoints.quantity,
                            events.name,
                            events.id as eventID,
                            housepoints.description,
                            housepoints.status,
                            UNIX_TIMESTAMP(housepoints.created) as created,
                            UNIX_TIMESTAMP(housepoints.completed) as completed,
                            rejectMessage
                        FROM housepoints, users, events
                        WHERE 
                            users.year IN (".str_repeat('?', $numYears).")
                            AND users.id = housepoints.student
                            AND events.id = housepoints.event
                        ",
                    str_repeat('i', $numYears), ...$years);
                echo json_encode($res);

            } else if (array_key_exists('event', $_GET)) {
                $res = $query(
                    "
                        SELECT 
                            housepoints.id,
                            users.name,
                            housepoints.quantity,
                            events.name,
                            housepoints.description,
                            housepoints.status,
                            UNIX_TIMESTAMP(housepoints.created) as created,
                            UNIX_TIMESTAMP(housepoints.completed) as completed,
                            rejectMessage
                        FROM housepoints, users, events
                        WHERE
                            events.id = ?
                            AND users.id = housepoints.student
                            AND events.id = housepoints.event
                        ", 'i', $_GET['event']);
                echo json_encode($res);

            } else {
                $res = $query("SELECT COUNT(*) FROM housepoints");
                echo json_encode($res);
            }
        });

        break;

    case 'POST':
        if (array_key_exists('studentid', $_GET)) {
            $studentID = $_GET['studentid'];

        } else {
            $studentID = $query(
                'SELECT id FROM users WHERE code = ?',
                's',
                $_GET['student']
            ) -> fetch_array(MYSQLI_ASSOC) ['id'];
        }

        if (!$studentID) {
            die('{}');
        }

        $query(
            'INSERT INTO housepoints (student, description, completed, status, quantity) VALUES (?, ?, CURRENT_TIMESTAMP, "Accepted", ?)',
            'is', $studentID, description, quantity
        );

        echo '1';
        break;

    case 'PUT':
        break;

    case 'PATCH':
        break;

    case 'DELETE':
        break;

    default:
        die("Error: invalid request method");
}
