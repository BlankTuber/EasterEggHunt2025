<?php
// Admin panel entry point
require_once '../includes/init.php';

// Simple admin authentication (in a real app, use proper authentication)
$admin_username = 'admin';
$admin_password = 'your_secure_admin_password'; // Change this!

// Check if user is logged in
$is_logged_in = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

// Process login
if (isset($_POST['login'])) {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if ($username === $admin_username && $password === $admin_password) {
        $_SESSION['admin_logged_in'] = true;
        $is_logged_in = true;
    } else {
        $login_error = 'Invalid username or password';
    }
}

// Process logout
if (isset($_GET['logout'])) {
    unset($_SESSION['admin_logged_in']);
    $is_logged_in = false;
    header('Location: index.php');
    exit;
}

// Handle actions if logged in
$section = $_GET['section'] ?? 'dashboard';
$action = $_GET['action'] ?? '';
$message = '';

if ($is_logged_in) {
    // Process form submissions
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $db = Database::getInstance();
        
        // Add/Edit challenge
        if (isset($_POST['save_challenge'])) {
            $id = $_POST['id'] ?? '';
            $challenge_code = $_POST['challenge_code'] ?? '';
            $title = $_POST['title'] ?? '';
            $description = $_POST['description'] ?? '';
            $path = $_POST['path'] ?? '';
            $sequence_order = $_POST['sequence_order'] ?? 0;
            $challenge_type = $_POST['challenge_type'] ?? '';
            $convergence_group = $_POST['convergence_group'] ?? '';
            $unlock_condition = $_POST['unlock_condition'] ?? '';
            
            if (empty($challenge_code) || empty($title) || empty($path)) {
                $message = 'Please fill in all required fields';
            } else {
                if (!empty($id)) {
                    // Update existing challenge
                    $sql = "UPDATE challenges SET 
                            challenge_code = :code,
                            title = :title,
                            description = :desc,
                            path = :path,
                            sequence_order = :seq,
                            challenge_type = :type,
                            convergence_group = :group,
                            unlock_condition = :cond
                            WHERE id = :id";
                    
                    $db->query($sql)
                       ->bind(':code', $challenge_code)
                       ->bind(':title', $title)
                       ->bind(':desc', $description)
                       ->bind(':path', $path)
                       ->bind(':seq', $sequence_order)
                       ->bind(':type', $challenge_type)
                       ->bind(':group', $convergence_group)
                       ->bind(':cond', $unlock_condition)
                       ->bind(':id', $id)
                       ->execute();
                    
                    $message = 'Challenge updated successfully';
                } else {
                    // Add new challenge
                    $sql = "INSERT INTO challenges 
                            (challenge_code, title, description, path, sequence_order, challenge_type, convergence_group, unlock_condition) 
                            VALUES 
                            (:code, :title, :desc, :path, :seq, :type, :group, :cond)";
                    
                    $db->query($sql)
                       ->bind(':code', $challenge_code)
                       ->bind(':title', $title)
                       ->bind(':desc', $description)
                       ->bind(':path', $path)
                       ->bind(':seq', $sequence_order)
                       ->bind(':type', $challenge_type)
                       ->bind(':group', $convergence_group)
                       ->bind(':cond', $unlock_condition)
                       ->execute();
                    
                    $message = 'Challenge added successfully';
                }
            }
        }
        
        // Add/Edit story segment
        if (isset($_POST['save_story'])) {
            $id = $_POST['id'] ?? '';
            $segment_code = $_POST['segment_code'] ?? '';
            $title = $_POST['title'] ?? '';
            $content = $_POST['content'] ?? '';
            $path = $_POST['path'] ?? '';
            $sequence_order = $_POST['sequence_order'] ?? 0;
            $unlock_condition = $_POST['unlock_condition'] ?? '';
            
            if (empty($segment_code) || empty($title) || empty($path)) {
                $message = 'Please fill in all required fields';
            } else {
                if (!empty($id)) {
                    // Update existing segment
                    $sql = "UPDATE story_segments SET 
                            segment_code = :code,
                            title = :title,
                            content = :content,
                            path = :path,
                            sequence_order = :seq,
                            unlock_condition = :cond
                            WHERE id = :id";
                    
                    $db->query($sql)
                       ->bind(':code', $segment_code)
                       ->bind(':title', $title)
                       ->bind(':content', $content)
                       ->bind(':path', $path)
                       ->bind(':seq', $sequence_order)
                       ->bind(':cond', $unlock_condition)
                       ->bind(':id', $id)
                       ->execute();
                    
                    $message = 'Story segment updated successfully';
                } else {
                    // Add new segment
                    $sql = "INSERT INTO story_segments 
                            (segment_code, title, content, path, sequence_order, unlock_condition) 
                            VALUES 
                            (:code, :title, :content, :path, :seq, :cond)";
                    
                    $db->query($sql)
                       ->bind(':code', $segment_code)
                       ->bind(':title', $title)
                       ->bind(':content', $content)
                       ->bind(':path', $path)
                       ->bind(':seq', $sequence_order)
                       ->bind(':cond', $unlock_condition)
                       ->execute();
                    
                    $message = 'Story segment added successfully';
                }
            }
        }
        
        // Add/Edit unlock message
        if (isset($_POST['save_message'])) {
            $id = $_POST['id'] ?? '';
            $message_code = $_POST['message_code'] ?? '';
            $title = $_POST['title'] ?? '';
            $message_text = $_POST['message'] ?? '';
            
            if (empty($message_code) || empty($title)) {
                $message = 'Please fill in all required fields';
            } else {
                if (!empty($id)) {
                    // Update existing message
                    $sql = "UPDATE unlock_messages SET 
                            message_code = :code,
                            title = :title,
                            message = :msg
                            WHERE id = :id";
                    
                    $db->query($sql)
                       ->bind(':code', $message_code)
                       ->bind(':title', $title)
                       ->bind(':msg', $message_text)
                       ->bind(':id', $id)
                       ->execute();
                    
                    $message = 'Unlock message updated successfully';
                } else {
                    // Add new message
                    $sql = "INSERT INTO unlock_messages 
                            (message_code, title, message) 
                            VALUES 
                            (:code, :title, :msg)";
                    
                    $db->query($sql)
                       ->bind(':code', $message_code)
                       ->bind(':title', $title)
                       ->bind(':msg', $message_text)
                       ->execute();
                    
                    $message = 'Unlock message added successfully';
                }
            }
        }
        
        // Add/Edit user
        if (isset($_POST['save_user'])) {
            $id = $_POST['id'] ?? '';
            $user_id = $_POST['user_id'] ?? '';
            $name = $_POST['name'] ?? '';
            $current_path = $_POST['current_path'] ?? 'intro';
            $current_challenge = $_POST['current_challenge'] ?? null;
            
            if (empty($user_id)) {
                $message = 'User ID is required';
            } else {
                if (!empty($id)) {
                    // Update existing user
                    $sql = "UPDATE users SET 
                            user_id = :user_id,
                            name = :name,
                            current_path = :path,
                            current_challenge = :challenge
                            WHERE id = :id";
                    
                    $db->query($sql)
                       ->bind(':user_id', $user_id)
                       ->bind(':name', $name)
                       ->bind(':path', $current_path)
                       ->bind(':challenge', $current_challenge)
                       ->bind(':id', $id)
                       ->execute();
                    
                    $message = 'User updated successfully';
                } else {
                    // Add new user
                    $sql = "INSERT INTO users 
                            (user_id, name, current_path, current_challenge) 
                            VALUES 
                            (:user_id, :name, :path, :challenge)";
                    
                    $db->query($sql)
                       ->bind(':user_id', $user_id)
                       ->bind(':name', $name)
                       ->bind(':path', $current_path)
                       ->bind(':challenge', $current_challenge)
                       ->execute();
                    
                    $message = 'User added successfully';
                }
            }
        }
    }
    
    // Handle delete actions
    if ($action === 'delete') {
        $db = Database::getInstance();
        $id = $_GET['id'] ?? '';
        
        if (!empty($id)) {
            switch ($section) {
                case 'challenges':
                    $db->query("DELETE FROM challenges WHERE id = :id")
                       ->bind(':id', $id)
                       ->execute();
                    $message = 'Challenge deleted successfully';
                    break;
                case 'story':
                    $db->query("DELETE FROM story_segments WHERE id = :id")
                       ->bind(':id', $id)
                       ->execute();
                    $message = 'Story segment deleted successfully';
                    break;
                case 'messages':
                    $db->query("DELETE FROM unlock_messages WHERE id = :id")
                       ->bind(':id', $id)
                       ->execute();
                    $message = 'Unlock message deleted successfully';
                    break;
                case 'users':
                    $db->query("DELETE FROM users WHERE id = :id")
                       ->bind(':id', $id)
                       ->execute();
                    $message = 'User deleted successfully';
                    break;
            }
        }
    }
    
    // Get data for edit forms
    $edit_data = null;
    if ($action === 'edit') {
        $db = Database::getInstance();
        $id = $_GET['id'] ?? '';
        
        if (!empty($id)) {
            switch ($section) {
                case 'challenges':
                    $edit_data = $db->query("SELECT * FROM challenges WHERE id = :id")
                                   ->bind(':id', $id)
                                   ->single();
                    break;
                case 'story':
                    $edit_data = $db->query("SELECT * FROM story_segments WHERE id = :id")
                                   ->bind(':id', $id)
                                   ->single();
                    break;
                case 'messages':
                    $edit_data = $db->query("SELECT * FROM unlock_messages WHERE id = :id")
                                   ->bind(':id', $id)
                                   ->single();
                    break;
                case 'users':
                    $edit_data = $db->query("SELECT * FROM users WHERE id = :id")
                                   ->bind(':id', $id)
                                   ->single();
                    break;
            }
        }
    }
}

// Include HTML header
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kingdom Hunt Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { padding-top: 20px; }
        .nav-pills .nav-link.active { background-color: #198754; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="mb-4">Kingdom Hunt Admin</h1>
        
        <?php if (!$is_logged_in): ?>
            <!-- Login Form -->
            <div class="row">
                <div class="col-md-6 offset-md-3">
                    <div class="card">
                        <div class="card-header">Admin Login</div>
                        <div class="card-body">
                            <?php if (isset($login_error)): ?>
                                <div class="alert alert-danger"><?php echo $login_error; ?></div>
                            <?php endif; ?>
                            
                            <form method="post" action="">
                                <div class="mb-3">
                                    <label for="username" class="form-label">Username</label>
                                    <input type="text" class="form-control" id="username" name="username" required>
                                </div>
                                <div class="mb-3">
                                    <label for="password" class="form-label">Password</label>
                                    <input type="password" class="form-control" id="password" name="password" required>
                                </div>
                                <button type="submit" name="login" class="btn btn-primary">Login</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <!-- Admin Panel -->
            <div class="row">
                <div class="col-md-3">
                    <div class="list-group">
                        <a href="?section=dashboard" class="list-group-item list-group-item-action <?php echo $section === 'dashboard' ? 'active' : ''; ?>">Dashboard</a>
                        <a href="?section=challenges" class="list-group-item list-group-item-action <?php echo $section === 'challenges' ? 'active' : ''; ?>">Challenges</a>
                        <a href="?section=story" class="list-group-item list-group-item-action <?php echo $section === 'story' ? 'active' : ''; ?>">Story Segments</a>
                        <a href="?section=messages" class="list-group-item list-group-item-action <?php echo $section === 'messages' ? 'active' : ''; ?>">Unlock Messages</a>
                        <a href="?section=users" class="list-group-item list-group-item-action <?php echo $section === 'users' ? 'active' : ''; ?>">Users</a>
                        <a href="?logout=1" class="list-group-item list-group-item-action text-danger">Logout</a>
                    </div>
                </div>
                <div class="col-md-9">
                    <?php if (!empty($message)): ?>
                        <div class="alert alert-success"><?php echo $message; ?></div>
                    <?php endif; ?>
                    
                    <?php
                    // Load appropriate section content
                    switch ($section) {
                        case 'dashboard':
                            include 'sections/dashboard.php';
                            break;
                        case 'challenges':
                            include 'sections/challenges.php';
                            break;
                        case 'story':
                            include 'sections/story.php';
                            break;
                        case 'messages':
                            include 'sections/messages.php';
                            break;
                        case 'users':
                            include 'sections/users.php';
                            break;
                        default:
                            include 'sections/dashboard.php';
                    }
                    ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>