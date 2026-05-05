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
    $required_fields = ['name', 'email', 'password', 'confirmPassword'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            throw new Exception("Missing required field: $field");
        }
    }

    $name = trim($input['name']);
    $email = trim($input['email']);
    $password = $input['password'];
    $confirmPassword = $input['confirmPassword'];

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Check if passwords match
    if ($password !== $confirmPassword) {
        throw new Exception('Passwords do not match');
    }

    // Validate password strength
    if (strlen($password) < 12 || strlen($password) > 16) {
        throw new Exception('Password must be 12-16 characters long');
    }

    if (!preg_match('/[A-Z]/', $password)) {
        throw new Exception('Password must contain at least one uppercase letter');
    }

    if (!preg_match('/[a-z]/', $password)) {
        throw new Exception('Password must contain at least one lowercase letter');
    }

    if (!preg_match('/[0-9]/', $password)) {
        throw new Exception('Password must contain at least one number');
    }

    if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
        throw new Exception('Password must contain at least one special character');
    }

    // Check if user already exists in users table
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        throw new Exception('Account already exists for this email');
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Normalize email to lowercase for consistent storage
    $email = strtolower(trim($email));
    
    // Generate OTP for email verification
    $otp = rand(100000, 999999);

    // Store registration data temporarily - use MySQL DATE_ADD for consistent expiration
    $stmt = $pdo->prepare("INSERT INTO temp_registration (name, email, password, otp_expires, created_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
                          ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), otp_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE), created_at = NOW()");
    $stmt->execute([$name, $email, $hashedPassword]);

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

    $emailSent = $emailService->sendOTP($email, $name, $otp);
    if (!$emailSent) {
        // Log the failure but continue - user can request resend
        error_log("Email sending failed for registration: {$email}");
        // For debugging, you can uncomment to see errors:
        // throw new Exception('Email service failed. Please try again.');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Registration successful! Please check your email for verification code.',
        'data' => [
            'email' => $email,
            'name' => $name
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
