<?php
require('./private/util.php');

/** ADMIN
 * GET change-admin.php: '1' | error
 *
 * ?id= number - the id of the student to promote/demote
 * ?admin= number[0,1] - whether they should be an admin or not
 *
 * Changes a user from admin to non-admin or vice versa.
 * You cannot change your own admin privileges,
 * so there must always be at least 1 admin account (if one originally)
 */

define("id", $_GET['id']);
define("admin", $_GET['admin']);
define('myCode', $_GET['myCode']);

queries(true, function ($query) {

    // make sure you are not de-adminifying yourself
    // which should not be allowed to make sure there is always one admin
    $res = $query(
        'SELECT admin, id FROM users WHERE code = ?',
        's', myCode
    );
    $self = $res->fetch_array(MYSQLI_ASSOC);
    if (!$self) {
        die('0');
    } else if ($self['admin'] != 1) {
        die('0');
    } else if ($self['id'] == id) {
        die('0');
    }

    $query(
		'UPDATE users SET admin = ? WHERE id=?',
		'ii', admin, id
    );

    echo '1';
});
