<?php
require('./private/util.php');

$myfile = fopen("test.txt", "w") or die("Unable to open file!");

fwrite($myfile, "1");

queries(true, function ($query) {

	$myfile = fopen("test.txt", "w") or die("Unable to open file!");

	fwrite($myfile, "2");


	// check that we can connect to the database
	$query("SELECT * FROM users LIMIT 1");
	fwrite($myfile, "3");

	echo 1;

	fwrite($myfile, "4");
});