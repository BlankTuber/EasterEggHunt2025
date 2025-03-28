<?php
class Game {
    // Get current challenge for user
    public static function getCurrentChallenge($user_id) {
        $db = Database::getInstance();
        $sql = "SELECT c.* FROM challenges c
                JOIN users u ON c.id = u.current_challenge
                WHERE u.user_id = :user_id
                LIMIT 1";
        
        $challenge = $db->query($sql)
                       ->bind(':user_id', $user_id)
                       ->single();
        
        if (!$challenge) {
            // If no current challenge is set, get the first challenge of user's current path
            $user = $db->query("SELECT current_path FROM users WHERE user_id = :user_id")
                      ->bind(':user_id', $user_id)
                      ->single();
            
            if (!$user) {
                return false;
            }
            
            $sql = "SELECT * FROM challenges 
                    WHERE path = :path 
                    ORDER BY sequence_order 
                    LIMIT 1";
            
            $challenge = $db->query($sql)
                           ->bind(':path', $user['current_path'])
                           ->single();
        }
        
        return $challenge;
    }
    
    // Get next challenge for user
    public static function getNextChallenge($user_id, $current_challenge_id) {
        $db = Database::getInstance();
        
        // Get current challenge details
        $current = $db->query("SELECT * FROM challenges WHERE id = :id")
                     ->bind(':id', $current_challenge_id)
                     ->single();
        
        if (!$current) {
            return false;
        }
        
        // Get next challenge in sequence
        $sql = "SELECT * FROM challenges 
                WHERE path = :path 
                AND sequence_order > :seq 
                ORDER BY sequence_order 
                LIMIT 1";
        
        $next = $db->query($sql)
                  ->bind(':path', $current['path'])
                  ->bind(':seq', $current['sequence_order'])
                  ->single();
        
        // If no next challenge in current path, check if we need to move to next path
        if (!$next) {
            // Check if we're at the end of a path
            switch ($current['path']) {
                case 'path1':
                    // Check if all users have completed their first path
                    if (self::checkAllUsersCompletedPath('path1')) {
                        // Move to middle convergence
                        return self::getFirstChallengeInPath('middle_convergence');
                    }
                    break;
                case 'middle_convergence':
                    // After middle convergence, move to path2
                    return self::getFirstChallengeInPath('path2');
                case 'path2':
                    // Check if all users have completed their second path
                    if (self::checkAllUsersCompletedPath('path2')) {
                        // Move to final convergence
                        return self::getFirstChallengeInPath('final_convergence');
                    }
                    break;
                case 'final_convergence':
                    // After final convergence, move to epilogue
                    return self::getFirstChallengeInPath('epilogue');
            }
        }
        
        return $next;
    }
    
    // Get first challenge in a path
    private static function getFirstChallengeInPath($path) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM challenges 
                WHERE path = :path 
                ORDER BY sequence_order 
                LIMIT 1";
        
        return $db->query($sql)
                 ->bind(':path', $path)
                 ->single();
    }
    
    // Check if all users have completed a specific path
    private static function checkAllUsersCompletedPath($path) {
        $db = Database::getInstance();
        
        // Get all challenges in the path
        $sql = "SELECT id FROM challenges WHERE path = :path";
        $challenges = $db->query($sql)
                        ->bind(':path', $path)
                        ->resultSet();
        
        if (empty($challenges)) {
            return false;
        }
        
        $challengeIds = array_column($challenges, 'id');
        
        // Get all users
        $users = $db->query("SELECT user_id FROM users")->resultSet();
        
        if (empty($users)) {
            return false;
        }
        
        // For each user, check if they've completed all challenges in the path
        foreach ($users as $user) {
            foreach ($challengeIds as $challenge_id) {
                $sql = "SELECT id FROM challenge_completions 
                        WHERE user_id = :user_id 
                        AND challenge_id = :challenge_id 
                        LIMIT 1";
                
                $completion = $db->query($sql)
                               ->bind(':user_id', $user['user_id'])
                               ->bind(':challenge_id', $challenge_id)
                               ->single();
                
                if (!$completion) {
                    // User hasn't completed this challenge
                    return false;
                }
            }
        }
        
        // All users have completed all challenges in the path
        return true;
    }
    
    // Complete a challenge
    public static function completeChallenge($user_id, $challenge_id) {
        $db = Database::getInstance();
        
        // First check if user has already completed this challenge
        $sql = "SELECT id FROM challenge_completions 
                WHERE user_id = :user_id 
                AND challenge_id = :challenge_id 
                LIMIT 1";
        
        $existing = $db->query($sql)
                      ->bind(':user_id', $user_id)
                      ->bind(':challenge_id', $challenge_id)
                      ->single();
        
        if ($existing) {
            // Already completed
            return true;
        }
        
        // Mark challenge as completed
        $sql = "INSERT INTO challenge_completions (user_id, challenge_id) 
                VALUES (:user_id, :challenge_id)";
        
        $db->query($sql)
           ->bind(':user_id', $user_id)
           ->bind(':challenge_id', $challenge_id)
           ->execute();
        
        // Get challenge details
        $challenge = $db->query("SELECT * FROM challenges WHERE id = :id")
                       ->bind(':id', $challenge_id)
                       ->single();
        
        if (!$challenge) {
            return false;
        }
        
        // Unlock corresponding story segment if any
        $sql = "SELECT id FROM story_segments 
                WHERE unlock_condition LIKE :condition 
                LIMIT 1";
        
        $segment = $db->query($sql)
                     ->bind(':condition', '%' . $challenge['challenge_code'] . '%')
                     ->single();
        
        if ($segment) {
            self::unlockStorySegment($user_id, $segment['id']);
        }
        
        // Check if this is a convergence challenge
        if ($challenge['challenge_type'] == 'convergence_minor' || $challenge['challenge_type'] == 'convergence_major') {
            // Mark user as ready for the convergence
            $sql = "INSERT INTO convergence_readiness (convergence_id, user_id, ready, ready_at) 
                    VALUES (:convergence_id, :user_id, TRUE, NOW())
                    ON DUPLICATE KEY UPDATE ready = TRUE, ready_at = NOW()";
            
            $db->query($sql)
               ->bind(':convergence_id', $challenge_id)
               ->bind(':user_id', $user_id)
               ->execute();
            
            // Notify socket server about convergence readiness update
            Utils::notifySocketServer('convergence_update', [
                'convergence_id' => $challenge_id,
                'user_id' => $user_id,
                'ready' => true
            ]);
        }
        
        // Get next challenge
        $nextChallenge = self::getNextChallenge($user_id, $challenge_id);
        
        if ($nextChallenge) {
            // Update user's current challenge
            Auth::updateUserProgress($user_id, $nextChallenge['path'], $nextChallenge['id']);
            
            // Check if new challenge is available or needs to wait for others
            $isAvailable = self::isChallengeAvailable($user_id, $nextChallenge['id']);
            
            // Get unlock message
            $message = self::getUnlockMessage('challenge_completed');
            
            // Return information about next challenge
            return [
                'success' => true,
                'message' => $message,
                'next_challenge' => [
                    'id' => $nextChallenge['id'],
                    'title' => $nextChallenge['title'],
                    'description' => $nextChallenge['description'],
                    'type' => $nextChallenge['challenge_type'],
                    'is_available' => $isAvailable
                ]
            ];
        }
        
        return [
            'success' => true,
            'message' => self::getUnlockMessage('path_completed'),
            'game_completed' => true
        ];
    }
    
    // Check if a challenge is available (all prerequisites met)
    public static function isChallengeAvailable($user_id, $challenge_id) {
        $db = Database::getInstance();
        
        // Get challenge details
        $challenge = $db->query("SELECT * FROM challenges WHERE id = :id")
                       ->bind(':id', $challenge_id)
                       ->single();
        
        if (!$challenge) {
            return false;
        }
        
        // If no unlock condition, it's available
        if (empty($challenge['unlock_condition'])) {
            return true;
        }
        
        // Parse unlock condition (JSON)
        $conditions = json_decode($challenge['unlock_condition'], true);
        
        if (!$conditions) {
            return true;
        }
        
        // If it's a convergence, check if all required users are ready
        if ($challenge['challenge_type'] == 'convergence_minor' || $challenge['challenge_type'] == 'convergence_major') {
            $group = $challenge['convergence_group'];
            
            if (empty($group)) {
                return true;
            }
            
            // Get all users in the convergence group
            $users = self::getUsersInConvergenceGroup($group);
            
            if (empty($users)) {
                return true;
            }
            
            // Check if all users have completed their prerequisites
            foreach ($users as $groupUser) {
                if (isset($conditions['requires_challenge'])) {
                    foreach ($conditions['requires_challenge'] as $required) {
                        // Get challenge by code
                        $req = $db->query("SELECT id FROM challenges WHERE challenge_code = :code")
                                 ->bind(':code', $required)
                                 ->single();
                        
                        if (!$req) {
                            continue;
                        }
                        
                        // Check if this user has completed the required challenge
                        $completed = $db->query("SELECT id FROM challenge_completions WHERE user_id = :user_id AND challenge_id = :challenge_id")
                                      ->bind(':user_id', $groupUser)
                                      ->bind(':challenge_id', $req['id'])
                                      ->single();
                        
                        if (!$completed) {
                            return false;
                        }
                    }
                }
            }
            
            // Check if all users are ready for this convergence
            foreach ($users as $groupUser) {
                $ready = $db->query("SELECT ready FROM convergence_readiness WHERE convergence_id = :convergence_id AND user_id = :user_id")
                           ->bind(':convergence_id', $challenge_id)
                           ->bind(':user_id', $groupUser)
                           ->single();
                
                if (!$ready || !$ready['ready']) {
                    return false;
                }
            }
        } else {
            // For non-convergence challenges, check if user has completed required challenges
            if (isset($conditions['requires_challenge'])) {
                foreach ($conditions['requires_challenge'] as $required) {
                    // Get challenge by code
                    $req = $db->query("SELECT id FROM challenges WHERE challenge_code = :code")
                             ->bind(':code', $required)
                             ->single();
                    
                    if (!$req) {
                        continue;
                    }
                    
                    // Check if user has completed the required challenge
                    $completed = $db->query("SELECT id FROM challenge_completions WHERE user_id = :user_id AND challenge_id = :challenge_id")
                                  ->bind(':user_id', $user_id)
                                  ->bind(':challenge_id', $req['id'])
                                  ->single();
                    
                    if (!$completed) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    // Get users in a convergence group
    private static function getUsersInConvergenceGroup($group) {
        // Parse the group string (e.g., "navigator_craftsman")
        $roles = explode('_', $group);
        
        if (empty($roles)) {
            return [];
        }
        
        $db = Database::getInstance();
        $users = [];
        
        // For each role, get the corresponding user
        foreach ($roles as $role) {
            // The role should be mapped to a user in some way
            // For simplicity, we assume there's a one-to-one mapping between roles and users
            $user = $db->query("SELECT user_id FROM users WHERE role = :role LIMIT 1")
                      ->bind(':role', $role)
                      ->single();
            
            if ($user) {
                $users[] = $user['user_id'];
            }
        }
        
        return $users;
    }
    
    // Unlock a story segment
    public static function unlockStorySegment($user_id, $segment_id) {
        $db = Database::getInstance();
        
        // First check if user has already unlocked this segment
        $sql = "SELECT id FROM story_unlocks 
                WHERE user_id = :user_id 
                AND segment_id = :segment_id 
                LIMIT 1";
        
        $existing = $db->query($sql)
                      ->bind(':user_id', $user_id)
                      ->bind(':segment_id', $segment_id)
                      ->single();
        
        if ($existing) {
            // Already unlocked
            return true;
        }
        
        // Unlock the segment
        $sql = "INSERT INTO story_unlocks (user_id, segment_id) 
                VALUES (:user_id, :segment_id)";
        
        return $db->query($sql)
                 ->bind(':user_id', $user_id)
                 ->bind(':segment_id', $segment_id)
                 ->execute();
    }
    
    // Get custom message for an unlock event
    public static function getUnlockMessage($message_code) {
        $db = Database::getInstance();
        $sql = "SELECT title, message FROM unlock_messages 
                WHERE message_code = :code 
                LIMIT 1";
        
        $message = $db->query($sql)
                     ->bind(':code', $message_code)
                     ->single();
        
        if (!$message) {
            // Default messages if none found in database
            switch ($message_code) {
                case 'intro_completed':
                    return [
                        'title' => 'Welcome to the Kingdom of Neerbye!',
                        'message' => 'You have completed the introduction. Your journey now begins!'
                    ];
                case 'challenge_completed':
                    return [
                        'title' => 'Challenge Completed!',
                        'message' => 'You have successfully completed the challenge. The next part of your journey awaits.'
                    ];
                case 'path_completed':
                    return [
                        'title' => 'Path Completed!',
                        'message' => 'You have reached the end of this path. Wait for your fellow champions to join you for the convergence.'
                    ];
                case 'convergence_ready':
                    return [
                        'title' => 'Convergence Ready!',
                        'message' => 'All champions are now ready for the convergence. Work together to overcome this challenge!'
                    ];
                case 'game_completed':
                    return [
                        'title' => 'The Kingdom is Saved!',
                        'message' => 'Congratulations! You and your fellow champions have successfully completed your quest and saved the Kingdom of Neerbye!'
                    ];
                default:
                    return [
                        'title' => 'Progress Made',
                        'message' => 'You have made progress in your journey.'
                    ];
            }
        }
        
        return $message;
    }
}