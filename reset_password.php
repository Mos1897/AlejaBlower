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

    if (!isset($input['newPassword']) || empty($input['newPassword'])) {
        throw new Exception('New password is required');
    }

    if (!isset($input['confirmPassword']) || empty($input['confirmPassword'])) {
        throw new Exception('Password confirmation is required');
    }

    $email = strtolower(trim($input['email']));
    $newPassword = $input['newPassword'];
    $confirmPassword = $input['confirmPassword'];

    // Validate passwords match
    if ($newPassword !== $confirmPassword) {
        throw new Exception('Passwords do not match');
    }

    // Validate password strength
    if (strlen($newPassword) < 12 || strlen($newPassword) > 16) {
        throw new Exception('Password must be 12-16 characters long');
    }

    if (!preg_match('/[A-Z]/', $newPassword)) {
        throw new Exception('Password must contain at least one uppercase letter');
    }

    if (!preg_match('/[a-z]/', $newPassword)) {
        throw new Exception('Password must contain at least one lowercase letter');
    }

    if (!preg_match('/[0-9]/', $newPassword)) {
        throw new Exception('Password must contain at least one number');
    }

    if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $newPassword)) {
        throw new Exception('Password must contain at least one special character');
    }

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('User not found');
    }

    // Hash the new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$hashedPassword, $email]);

    error_log("Password reset successful for email: {$email}");

    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully! Redirecting to login...'
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

