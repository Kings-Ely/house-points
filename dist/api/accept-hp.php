<?php
require('./private/main.php');

/** ADMIN
 * GET accept-hp.php: '1' | error
 *
 * ?id= number - house point id
 * ?reject= ?string - optional parameter, if present is reason for rejecting, if not present accepts hp
 *
 * Either rejects or accepts a house point that is currently pending
 */

define('id', $_GET['id']);

queries(true, function ($query) {


    $query(
		'UPDATE housepoints SET completed = CURRENT_TIMESTAMP, status="Accepted" WHERE id = ?',
		'i', id
    );

    if (array_key_exists('reject', $_GET)) {
        $query(
			'UPDATE housepoints SET rejectMessage=?, status="Rejected" WHERE id = ?',
			'si', $_GET['reject'], id
        );
    }

    echo '1';
});
