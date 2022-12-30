<?php
require_once '../secrets.php';

try {
	$containerName = 'house-points-api-container';
	$serverPath = '~/hpsnea-server';

	// validate user

	// try to get session from either get parameters, post parameters, or cookies
	$session = $_GET['session'] ?? $_POST['session'] ??  $_COOKIE['session'] ?? '';

	if (!strlen($session))
		die('Error: no session');

	//                              constants defined in 'secrets.php'
	$conn = new mysqli('localhost', USERNAME, PASSWORD, DB_NAME       );

	// Check connection
	if ($conn->connect_error)
		die(0);
	echo "Connected successfully";

	$stmt = $conn->prepare("
		SELECT 1
		FROM sessions, users
		WHERE sessions.id = ?
			AND sessions.userId = users.id
			AND UNIX_TIMESTAMP(sessions.opened) + sessions.expires > UNIX_TIMESTAMP()
			AND sessions.active = 1
			AND users.admin = 1
	");
	// bind parameters for markers to avoid SQL injection
	$stmt->bind_param("s", $session);
	$stmt->execute();
	$stmt->bind_result($queryRes);
	$stmt->fetch();
	$stmt->close();

	if (!$queryRes)
		die(0);
	if (is_null($queryRes))
		die(0);
	if (count($queryRes) === 0)
		die(0);

	// command to start docker container

	if (strlen(`docker ps | grep $containerName`) < 2) {
		exec("cd $serverPath; npm run start");
		echo 1;
	} else {
		// if container is already running, restart it
		// instead of starting it
		exec("cd $serverPath; npm run restart");
		echo 1;
	}

} catch (Exception $e) {
    echo 'Caught exception: ',  $e->getMessage(), "\n";
}
