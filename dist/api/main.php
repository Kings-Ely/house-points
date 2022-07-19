<?php
const debug = true;

// imports relative to file being used, so this file can only be used in api/*.php files

if (debug) {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    ini_set('display_errors', true);
    error_reporting(E_ALL);

} else {

    function fail ($n, $errstr)
    {
        error_log($n . ': ' . $errstr);
        echo '{"error": "Uncaught error occurred"}';
        die();
    }

    set_error_handler("fail");

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    ini_set("log_errors", 1);
    ini_set("error_log", "./error.log");
    error_reporting(E_ALL);
    error_log( "--------------" );
}


const lowerAlphabet = 'abcdefghijklmnopqrstuvwxyz';
const USER_COOKIE_CODE_KEY = 'hpCode';

define('USER_COOKIE_CODE', array_key_exists(USER_COOKIE_CODE_KEY, $_COOKIE) ?
    $_COOKIE[USER_COOKIE_CODE_KEY] : '');

const servername = "localhost";


class DotEnv
{
    protected string $path;

    public function __construct ($path) {
        if (!file_exists($path)) {
            throw new InvalidArgumentException(sprintf('%s does not exist', $path));
        }
        $this->path = $path;
    }

    public function load (): void
    {
        if (!is_readable($this->path)) {
            throw new RuntimeException(sprintf('%s file is not readable', $this->path));
        }

        $lines = file($this->path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {

            if (str_starts_with(trim($line), '#')) {
                continue;
            }

            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}


// as a public API, allow anyone to access
function cors (): void
{

    // Allow from any origin
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        // Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
        // you want to allow, and if so:
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }

    // Access-Control headers are received during OPTIONS requests
    if (array_key_exists('REQUEST_METHOD', $_SERVER) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            // may also be using PUT, PATCH, HEAD etc
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

        die('Error with OPTIONS request headers');
    }
}


// custom api for making queries to database with a callback


/**
 * Does SQL injection prevention of parameters.
 * Closes connection after use.
 *
 * @example
 *   queries(function ($query) {
 *       $query('SELECT * FROM something WHERE id = ?', 'i', 1);
 *   });
 *
 * @param $require_admin
 * @param $cb
 * @return void
 */
function queries ($require_admin, $cb): void
{
    // DB credentials
    $username = getenv('DB_USER');
    $password = getenv('DB_PASS');
    $db = getenv('DB');

    // Create connection
    $con = new mysqli(servername, $username, $password, $db);

    // Check connection
    if ($con->connect_error) {
        die("Connection to database failed: " . $con->connect_error);
    }

    $dbQuery = function ($query, $d_types=null, ...$parameters) use ($con) {

        $stmt = $con->prepare($query);
        if (!$stmt) {
            die('Failed to execute statement');
        }

        if ($d_types) {
            if (!$stmt->bind_param($d_types, ...$parameters)) {
                die('failed to bind parameters');
            }
        }

        if (!$stmt->execute()) {
            die('failed to execute sql query');
        }

        return $stmt->get_result();
    };

    if ($require_admin) {

        $res = $dbQuery(
            'SELECT admin FROM users WHERE code = ?',
            's', USER_COOKIE_CODE
        );
        $row = $res->fetch_array(MYSQLI_ASSOC);
        if (!$row) {
            echo 'ADMIN_REQUIRED';
            return;
        } else if ($row['admin'] != 1) {
            echo 'ADMIN_REQUIRED';
            return;
        }
    }

    $cb($dbQuery);

    $con->close();
}

/**
 * Solution taken from here:
 * http://stackoverflow.com/a/13733588/1056679
 */
class RandomStringGenerator
{
    protected string $alphabet;

    protected int $alphabetLength;

    public function __construct (string $alphabet = '') {
        if ($alphabet !== '') {
            $this->set_alphabet($alphabet);
        } else {
            $this->set_alphabet(
                implode(range('a', 'z'))
                . implode(range('A', 'Z'))
                . implode(range(0, 9))
            );
        }
    }

    public function set_alphabet (string $alphabet): void
    {
        $this->alphabet = $alphabet;
        $this->alphabetLength = strlen($alphabet);
    }

    public function generate (int $length): string
    {
        $token = '';

        for ($i = 0; $i < $length; $i++) {
            $randomKey = $this->get_rand_int(0, $this->alphabetLength);
            $token .= $this->alphabet[$randomKey];
        }

        return $token;
    }

    protected function get_rand_int (int $min, int $max): int
    {
        $range = ($max - $min);

        if ($range < 0) {
            // Not so random...
            return $min;
        }

        $log = log($range, 2);

        // Length in bytes.
        $bytes = (int) ($log / 8) + 1;

        // Length in bits.
        $bits = (int) $log + 1;

        // Set all lower bits to 1.
        $filter = (1 << $bits) - 1;

        do {
            $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));

            // Discard irrelevant bits.
            $rnd = $rnd & $filter;

        } while ($rnd >= $range);

        return ($min + $rnd);
    }
}

function user_from_code ($code, $query): int
{
    if (!$code) {
        return 0;
    }
    $res = $query(
        'SELECT id FROM users WHERE code = ?',
        's',
        $_GET['student']
    ) -> fetch_array(MYSQLI_ASSOC);

    if (!$res || !$res['id']) {
        return 0;
    }

    return $res['id'];
}

function admin_lvl_from_code ($code, $query): int
{
    if (!$code) {
        return 0;
    }
    $res = $query(
        'SELECT admin FROM users WHERE code = ?',
        's',
        $_GET['student']
    ) -> fetch_array(MYSQLI_ASSOC);

    if (!$res || !$res['admin']) {
        return 0;
    }

    return $res['admin'];
}

function main (): void
{
    cors();
    (new DotEnv(__DIR__ . '/.env'))->load();
}

main();
