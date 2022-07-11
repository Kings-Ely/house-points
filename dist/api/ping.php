<?php
require('./private/util.php');

queries(false, function ($query) {

	// check that we can connect to the database
	$query("SELECT * FROM users LIMIT 1");

	echo 1;
});