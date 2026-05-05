<?php

// PHPMailer configuration and EmailService for sending OTP emails
// Fill in your SMTP settings below. Do NOT commit real passwords to a public repo.

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// If you installed PHPMailer via Composer, use the autoloader instead:
// require __DIR__ . '/../../../vendor/autoload.php';

// If you manually downloaded PHPMailer, adjust these paths to the PHPMailer files.
// Project structure has 'phpmailer' at the project root (c:/xampp/htdocs/laundry/phpmailer),
// and this file is in api/config, so we go two levels up and into 'phpmailer'.
require_once __DIR__ . '/../../phpmailer/PHPMailer.php';
require_once __DIR__ . '/../../phpmailer/SMTP.php';
require_once __DIR__ . '/../../phpmailer/Exception.php';

class EmailService
{
    // Configure your SMTP settings here
    // FOR GMAIL: Use App Password from https://support.google.com/accounts/answer/185833
    private string $host = 'smtp.gmail.com';        // Gmail SMTP server
    private int $port = 587;                        // 587 for TLS, 465 for SSL
    private string $username = 'aljhonbadilla1897@gmail.com';  // Your Gmail address
    private string $password = 'qozkungircqngxzd';  // Your App Password (16 characters, no spaces)
    private string $fromEmail = 'aljhonbadilla1897@gmail.com';
    private string $fromName = 'Aleja Blower';
    private bool $useSMTPAuth = true;
    private string $encryption = PHPMailer::ENCRYPTION_STARTTLS; // TLS for port 587

    /**
     * Send registration OTP (includes user name)
     */
    public function sendOTP(string $toEmail, string $toName, int $otp): bool
    {
        $subject = 'Your Verification Code';
        $body    = "Hello {$toName},<br><br>" .
                    'Your verification code is: <strong>' . $otp . "</strong><br>" .
                    'This code will expire in 10 minutes.<br><br>' .
                    'If you did not request this, you can ignore this email.';

        return $this->sendMail($toEmail, $toName, $subject, $body);
    }

    /**
     * Send login / reset / generic OTP (email only)
     */
    public function sendResendOTP(string $toEmail, int $otp): bool
    {
        $subject = 'Your One-Time Password';
        $body    = 'Your one-time verification code is: <strong>' . $otp . '</strong><br>' .
                   'This code will expire in 10 minutes.<br><br>' .
                   'If you did not request this, you can ignore this email.';

        return $this->sendMail($toEmail, $toEmail, $subject, $body);
    }

    /**
     * Internal helper to send an email via PHPMailer
     */
    private function sendMail(string $toEmail, string $toName, string $subject, string $htmlBody): bool
    {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = $this->host;
            $mail->SMTPAuth   = $this->useSMTPAuth;
            $mail->Username   = $this->username;
            $mail->Password   = $this->password;
            $mail->SMTPSecure = $this->encryption;
            $mail->Port       = $this->port;

            // Recipients
            $mail->setFrom($this->fromEmail, $this->fromName);
            $mail->addAddress($toEmail, $toName);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = strip_tags(str_replace('<br>', "\n", $htmlBody));

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('PHPMailer error: ' . $e->getMessage());
            return false;
        }
    }
}