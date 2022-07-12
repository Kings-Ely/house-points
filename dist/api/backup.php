<?php
require('./private/util.php');

/** ADMIN
 * GET backup.php: '1' | error
 */

queries(true, function ($query) {

	$query(<<<SQL
    	
SQL,
		''
    );

    echo '1';
});