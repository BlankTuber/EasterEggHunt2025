<?php
class Auth {
    // Check if user exists by user_id
    public static function userExists($user_id) {
        $db = Database::getInstance();
        $sql = "SELECT id FROM users WHERE user_id = :user_id LIMIT 1";
        
        $result = $db->query($sql)
                     ->bind(':user_id', $user_id)
                     ->single();
        
        return ($result) ? true : false;
    }
    
    // Create a new user
    public static function createUser($user_id) {
        $db = Database::getInstance();
        $sql = "INSERT INTO users (user_id, current_path) VALUES (:user_id, 'intro')";
        
        $db->query($sql)
           ->bind(':user_id', $user_id)
           ->execute();
        
        return $db->lastInsertId();
    }
    
    // Create a session for a user
    public static function createSession($user_id) {
        $db = Database::getInstance();
        $token = Utils::generateRandomString(64);
        $expires = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
        
        $sql = "INSERT INTO sessions (user_id, session_token, expires_at) 
                VALUES (:user_id, :token, :expires)";
        
        $db->query($sql)
           ->bind(':user_id', $user_id)
           ->bind(':token', $token)
           ->bind(':expires', $expires)
           ->execute();
        
        // Create JWT token for client-side authentication
        $jwt = Utils::generateJwtToken($user_id);
        
        return [
            'token' => $jwt,
            'expires' => $expires
        ];
    }
    
    // Validate user session
    public static function validateSession($token) {
        // Decode JWT token
        $payload = Utils::validateJwtToken($token);
        
        if (!$payload) {
            return false;
        }
        
        $user_id = $payload['user_id'];
        
        // Check if session exists in database
        $db = Database::getInstance();
        $sql = "SELECT * FROM sessions 
                WHERE user_id = :user_id 
                AND expires_at > NOW() 
                ORDER BY created_at DESC 
                LIMIT 1";
        
        $result = $db->query($sql)
                     ->bind(':user_id', $user_id)
                     ->single();
        
        if (!$result) {
            return false;
        }
        
        // Update last active timestamp
        $updateSql = "UPDATE users SET last_active = NOW() WHERE user_id = :user_id";
        $db->query($updateSql)
           ->bind(':user_id', $user_id)
           ->execute();
        
        return $user_id;
    }
    
    // Get user details
    public static function getUserDetails($user_id) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM users WHERE user_id = :user_id LIMIT 1";
        
        $user = $db->query($sql)
                   ->bind(':user_id', $user_id)
                   ->single();
        
        if (!$user) {
            return false;
        }
        
        // Get completed challenges
        $sql = "SELECT c.challenge_code, cc.completed_at 
                FROM challenge_completions cc
                JOIN challenges c ON cc.challenge_id = c.id
                WHERE cc.user_id = :user_id
                ORDER BY cc.completed_at";
        
        $challenges = $db->query($sql)
                        ->bind(':user_id', $user_id)
                        ->resultSet();
        
        // Get unlocked story segments
        $sql = "SELECT s.segment_code, s.title, s.content, su.unlocked_at 
                FROM story_unlocks su
                JOIN story_segments s ON su.segment_id = s.id
                WHERE su.user_id = :user_id
                ORDER BY s.sequence_order";
        
        $stories = $db->query($sql)
                      ->bind(':user_id', $user_id)
                      ->resultSet();
        
        // Enhanced user data
        $userData = [
            'user_id' => $user['user_id'],
            'name' => $user['name'],
            'current_path' => $user['current_path'],
            'current_challenge' => $user['current_challenge'],
            'created_at' => $user['created_at'],
            'last_active' => $user['last_active'],
            'completed_challenges' => $challenges,
            'unlocked_stories' => $stories
        ];
        
        return $userData;
    }
    
    // Update user progress
    public static function updateUserProgress($user_id, $path, $challenge_id = null) {
        $db = Database::getInstance();
        $sql = "UPDATE users SET current_path = :path";
        
        $params = [':user_id' => $user_id, ':path' => $path];
        
        if ($challenge_id !== null) {
            $sql .= ", current_challenge = :challenge_id";
            $params[':challenge_id'] = $challenge_id;
        }
        
        $sql .= " WHERE user_id = :user_id";
        
        $query = $db->query($sql);
        
        foreach ($params as $param => $value) {
            $query->bind($param, $value);
        }
        
        return $query->execute();
    }
    
    // Log out user
    public static function logout($user_id) {
        $db = Database::getInstance();
        $sql = "DELETE FROM sessions WHERE user_id = :user_id";
        
        return $db->query($sql)
                 ->bind(':user_id', $user_id)
                 ->execute();
    }
}