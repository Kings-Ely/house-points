<?php
require('./private/util.php');

/** ADMIN
 * GET delete-hp.php
 *
 * ?id= number - the id of the house point to delete
 *
 * Changes a user from admin to non-admin or vice versa.
 * You cannot change your own admin privileges,
 * so there must always be at least 1 admin account (if one originally)
 */

define("id", $_GET['id']);

queries(false, function ($query) {
    $query(
		'DELETE FROM housepoints WHERE id = ?',
		'i', id
    );
    echo '1';
});
