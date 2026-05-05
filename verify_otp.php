<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Session-Cookie: true');  // Ensure session cookies work with AJAX

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    if (!isset($input['otp']) || !isset($input['email']) || !isset($input['type'])) {
        throw new Exception('Missing required fields');
    }

    $otp = trim($input['otp']);
    $email = strtolower(trim($input['email']));
    $type = trim($input['type']);

    if ($otp === '' || $email === '') {
        throw new Exception('OTP and email are required');
    }

    if (!isset($pdo)) {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }

    $stmt = $pdo->prepare('SELECT otp, expires_at FROM otp_verification WHERE email = ? ORDER BY created_at DESC LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        throw new Exception('No OTP found for this email. Please request a new code.');
    }

    if ($row['otp'] != $otp) {
        throw new Exception('Invalid verification code.');
    }

    if (strtotime($row['expires_at']) < time()) {
        throw new Exception('Verification code has expired. Please request a new code.');
    }

    if ($type === 'register') {
        // For registration, complete the pending registration from temp_registration
        $regStmt = $pdo->prepare('SELECT name, email, password FROM temp_registration WHERE email = ?');
        $regStmt->execute([$email]);
        $regData = $regStmt->fetch(PDO::FETCH_ASSOC);

        if (!$regData) {
            throw new Exception('No pending registration found for this email.');
        }

        // The password in temp_registration is already hashed by register.php
        // so we can use it directly. We may rehash if algorithm has changed, but
        // double-hashing would break verification later.
        $hashedPassword = $regData['password'];

        // Check if user already exists
        $userStmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $userStmt->execute([$email]);
        $existingUser = $userStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingUser) {
            // Update existing user credentials and mark email as verified
            $updateStmt = $pdo->prepare('UPDATE users SET password_hash = ?, status = \'active\', email_verified_at = NOW() WHERE email = ?');
            $updateStmt->execute([$hashedPassword, $email]);
        } else {
            // Insert new user with a default role_id (1). Ensure your roles table
            // has an appropriate role with id=1 (e.g. tenant).
            $defaultRoleId = 1;
            $insertStmt = $pdo->prepare('INSERT INTO users (email, password_hash, role_id, status, email_verified_at) VALUES (?, ?, ?, \'active\', NOW())');
            $insertStmt->execute([$email, $hashedPassword, $defaultRoleId]);
        }

        $delTemp = $pdo->prepare('DELETE FROM temp_registration WHERE email = ?');
        $delTemp->execute([$email]);
    } elseif ($type === 'reset' || $type === 'login' || $type === 'change_password') {
        // For these flows, just validating OTP is enough; other endpoints handle follow-up.
    }

    // Login user after successful OTP verification
    $_SESSION['user_email'] = $email;
    $_SESSION['logged_in'] = true;
    
    // Get user ID for session
    $userStmt = $pdo->prepare('SELECT id, role_id FROM users WHERE email = ? LIMIT 1');
    $userStmt->execute([$email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role_id'] = $user['role_id'];
    }

    $delOtp = $pdo->prepare('DELETE FROM otp_verification WHERE email = ?');
    $delOtp->execute([$email]);

    echo json_encode([
        'success' => true,
        'message' => 'Verification successful.',
        'session_id' => session_id(),
        'logged_in' => true
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
