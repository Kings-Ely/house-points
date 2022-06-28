<?php
require('./private/util.php');

queries(true, function ($query) {

	$query(<<<SQL
    	
SQL,
		''
    );

    echo '1';
});