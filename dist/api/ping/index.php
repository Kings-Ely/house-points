<?php
require '../main.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])) {
    die('{"error": "invalid request method"}');
}

try {
    queries(false, function ($query) {

        try {
            // check that we can connect to the database
            $query("SELECT * FROM users LIMIT 1");

            echo "{}";
        } catch (Exception $e) {
            die('{"error": "'.$e->getMessage().'"}');
        }

    });
} catch (Exception $e) {
    die('{"error": "' . $e->getMessage() . '"}');
}
