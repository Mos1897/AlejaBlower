<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config/database.php';

// Check if $pdo is available, if not create connection
if (!isset($pdo)) {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        throw new Exception('Database connection failed: ' . $e->getMessage());
    }
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    if (!isset($input['email']) || empty(trim($input['email']))) {
        throw new Exception('Email is required');
    }

    $email = strtolower(trim($input['email']));

    // Basic email sanity check (use filter_var for clarity).
    // If the format is invalid we'll throw a distinct message so the
    // client knows the problem rather than misleading with "Email not found".
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Check if user exists and whether email is verified.
    // Schema stores profile info in `user_profiles` and verification timestamp in `email_verified_at`.
$stmt = $pdo->prepare(
        "SELECT u.id, u.email, u.email_verified_at, COALESCE(up.full_name, 'User') AS name
         FROM users u
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE LOWER(u.email) = LOWER(?)"
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('No account found with this email address.');
    }

    // Consider verified if `email_verified_at` is not null
    if (empty($user['email_verified_at'])) {
        throw new Exception('Account not verified. Please verify your email first.');
    }

    // Generate OTP for password reset
    $otp = rand(100000, 999999);

    // Store OTP in verification table - use MySQL DATE_ADD for consistent expiration calculation
    $stmt = $pdo->prepare("INSERT INTO otp_verification (email, otp, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
                          ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE), created_at = NOW()");
    $stmt->execute([$email, $otp]);
    
    // Get the actual expiration time that was stored (for debugging)
    $check_stmt = $pdo->prepare("SELECT expires_at FROM otp_verification WHERE email = ? ORDER BY created_at DESC LIMIT 1");
    $check_stmt->execute([$email]);
    $check_result = $check_stmt->fetch(PDO::FETCH_ASSOC);
    $actual_expires = $check_result ? $check_result['expires_at'] : 'unknown';

    // Send OTP email using PHPMailer
    require_once __DIR__ . '/config/email_config.php';
    $emailService = new EmailService();

    $emailSent = $emailService->sendResendOTP($email, $otp);
    if (!$emailSent) {
        error_log("Email sending failed for password reset: {$email}");
        // Continue anyway - user can request resend
    }

    echo json_encode([
        'success' => true,
        'message' => 'Password reset code sent to your email. Please check your inbox.',
        'data' => [
            'email' => $email
        ]
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
}
?>

