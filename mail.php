<?php


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? 'https://rdnx.in';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Credentials: true");
    exit;
}

session_start([
    'cookie_lifetime' => 60 * 60 * 24 * 7,
    'gc_maxlifetime'  => 60 * 60 * 24 * 7,
]);

require 'vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

$allowedOrigins = [
    'https://rdnx.in',
    'https://www.rdnx.in',
];

$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$host    = $_SERVER['HTTP_HOST'] ?? '';

if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle)
    {
        return $needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

$isAllowed = false;

// Check if origin is allowed
if (in_array($origin, $allowedOrigins)) {
    $isAllowed = true;
}

// Fallback for same-origin requests or missing origin header (e.g. direct form submit if not AJAX, though we use AJAX)
if (!$isAllowed && (empty($origin) || strpos($origin, $host) !== false)) {
    $isAllowed = true;
}

// If not allowed by origin, check referer as a fallback for some older browsers/proxies
if (!$isAllowed) {
    foreach ($allowedOrigins as $allowed) {
        if ($referer && str_starts_with($referer, $allowed)) {
            $isAllowed = true;
            break;
        }
    }
}

if (!$isAllowed) {
    http_response_code(403);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Access denied.',
        'debug'   => [
            'origin'  => $origin,
            'referer' => $referer,
            'host'    => $host
        ]
    ]);
    exit;
}

header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
header("Vary: Origin");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// Load .env from current directory
$envPath = __DIR__ . '/.env';

if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
        $_ENV[trim($name)] = trim($value);
    }
} else {
     // Log error or handle missing env
     error_log("Environment file not found at: " . $envPath);
}

$response = ['status' => 'error', 'message' => 'Something went wrong.'];

try {

    // if (!isset($_SESSION['form_submissions'])) {
    //     $_SESSION['form_submissions'] = 0;
    // }

    // if ($_SESSION['form_submissions'] >= 5) {
    //     echo json_encode([
    //         'status' => 'error',
    //         'message' => 'You have reached your submission limit (5 per week).'
    //     ]);
    //     exit;
    // }

    $input = json_decode(file_get_contents("php://input"), true);

    if (empty($input['name']) || empty($input['email']) || empty($input['phone'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing required fields (Name, Email, Phone).'
        ]);
        exit;
    }

    $name = htmlspecialchars(strip_tags($input['name']));
    $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
    $phone = htmlspecialchars(strip_tags($input['phone']));
    $message = htmlspecialchars(strip_tags($input['message'] ?? ''));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
         echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email format.'
        ]);
        exit;
    }

    $fromEmail     = $_ENV['FROM_EMAIL'] ?? '';
    $fromName      = $_ENV['FROM_NAME'] ?? 'RDNX Site';
    $emailPassword = $_ENV['PASS'] ?? '';
    $receiverMail  = $_ENV['MAIL_RECEIVER'] ?? '';
    $port          = (int)($_ENV['PORT'] ?? 587);
    $host          = $_ENV['HOST'] ?? '';

    if (empty($fromEmail) || empty($emailPassword) || empty($receiverMail) || empty($host)) {
        throw new Exception("Email configuration is missing.");
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $host;
    $mail->SMTPAuth   = true;
    $mail->Username   = $fromEmail;
    $mail->Password   = $emailPassword;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $port;

    $mail->setFrom($fromEmail, $fromName);
    $mail->addAddress($receiverMail);
    $mail->addReplyTo($email, $name); // Reply to the user who filled the form

    $mail->isHTML(true);
    $mail->Subject = "New Contact Enquiry from $name";
    
    $emailBody = "
    <h2>New Contact Enquiry</h2>
    <p><strong>Name:</strong> $name</p>
    <p><strong>Email:</strong> $email</p>
    <p><strong>Phone:</strong> $phone</p>
    <p><strong>Message:</strong><br>" . nl2br($message) . "</p>
    ";

    $mail->Body    = $emailBody;
    $mail->AltBody = "Name: $name\nEmail: $email\nPhone: $phone\nMessage:\n$message";

    $mail->send();

    $_SESSION['form_submissions'] = ($_SESSION['form_submissions'] ?? 0) + 1;

    $response = [
        'status'  => 'success',
        'message' => 'Thank you! Your message has been sent successfully.'
        ];

} catch (Exception $e) {
    $response = [
        'status'  => 'error',
        'message' => 'Message could not be sent. Mailer Error: ' . $mail->ErrorInfo
    ];
}

echo json_encode($response);
