<?php
require('./private/util.php');

/** ADMIN
 * GET change-admin.php: '1' | error
 *
 * ?id= number - the id of the student to promote/demote
 *
 * Changes a user from admin to non-admin or vice versa. You cannot
 */

queries(true, function ($query) {
    $id = $_GET['id'];

    // make sure you are not de-adminifying yourself
    // which should not be allowed to make sure there is always one admin
    $res = $query(
        'SELECT admin, id FROM users WHERE code = ?',
        's', $_GET['myCode']
    );
    $self = $res->fetch_array(MYSQLI_ASSOC);
    if (!$self) {
        die('0');
    } else if ($self['admin'] != 1) {
        die('0');
    } else if ($self['id'] == $id) {
        die('0');
    }

    $query(
		'UPDATE users SET admin = ? WHERE id=?',
		'ii', $_GET['admin'], $id
    );

    echo '1';
});