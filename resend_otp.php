<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/email_config.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['email'])) {
        throw new Exception('Email is required');
    }

    $email = strtolower(trim($input['email']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    if (!isset($pdo)) {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }

    $otp = rand(100000, 999999);

    $stmt = $pdo->prepare('INSERT INTO otp_verification (email, otp, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
                          ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE), created_at = NOW()');
    $stmt->execute([$email, $otp]);

    $emailService = new EmailService();
    $emailService->sendResendOTP($email, $otp);

    echo json_encode([
        'success' => true,
        'message' => 'A new verification code has been sent if the email exists in our system.',
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
    ]);
}
