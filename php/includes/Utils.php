<?php
class Utils {
    // Generate a random string for tokens, session IDs, etc.
    public static function generateRandomString($length = 32) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $randomString = '';
        
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        return $randomString;
    }
    
    // Create JWT token for authentication
    public static function generateJwtToken($user_id) {
        $issuedAt = time();
        $expirationTime = $issuedAt + SESSION_LIFETIME;
        
        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'user_id' => $user_id
        ];
        
        // Encode Header
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        
        // Encode Payload
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
        
        // Create Signature Hash
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, TOKEN_SECRET, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        // Create JWT
        $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
        
        return $jwt;
    }
    
    // Validate JWT token
    public static function validateJwtToken($token) {
        $tokenParts = explode(".", $token);
        
        if (count($tokenParts) != 3) {
            return false;
        }
        
        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
        $signatureProvided = $tokenParts[2];
        
        // Check if token is expired
        $payload = json_decode($payload, true);
        if ($payload['exp'] < time()) {
            return false;
        }
        
        // Verify signature
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, TOKEN_SECRET, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if ($base64UrlSignature !== $signatureProvided) {
            return false;
        }
        
        return $payload;
    }
    
    // Send response as JSON
    public static function sendJsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
    
    // Send error response as JSON
    public static function sendErrorResponse($message, $statusCode = 400) {
        self::sendJsonResponse(['error' => $message], $statusCode);
    }
    
    // Log activity/events
    public static function logActivity($user_id, $activity, $details = '') {
        $db = Database::getInstance();
        $sql = "INSERT INTO activity_logs (user_id, activity, details) VALUES (:user_id, :activity, :details)";
        
        $db->query($sql)
           ->bind(':user_id', $user_id)
           ->bind(':activity', $activity)
           ->bind(':details', $details)
           ->execute();
    }
    
    // Make a request to SocketIO server
    public static function notifySocketServer($event, $data) {
        $url = SOCKETIO_URL . '/notify';
        $postData = [
            'event' => $event,
            'data' => $data
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-API-Key: ' . SOCKETIO_API_KEY // You should add this to config.php
        ]);
        
        $response = curl_exec($ch);
        
        if (curl_errno($ch)) {
            error_log('Socket Notification Error: ' . curl_error($ch));
        }
        
        curl_close($ch);
        
        return $response;
    }
}