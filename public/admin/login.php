<?php
require_once __DIR__ . '/../../includes/init.php'; // Use init for session start

$error = '';
if (is_admin_logged_in()) {
    header('Location: /admin/index.php'); // Redirect if already logged in
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if (login_admin($username, $password)) {
        header('Location: /admin/index.php');
        exit;
    } else {
        $error = 'Invalid username or password.';
    }
}

if (isset($_GET['error']) && $_GET['error'] === 'not_logged_in') {
    $error = 'You must be logged in to view the admin area.';
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login</title>
    <link rel="stylesheet" href="/assets/style.css">
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .login-box { width: 300px; padding: 2em; background: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); border-radius: 8px; }
        .error { color: red; margin-bottom: 1em; }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>Admin Login</h2>
        <?php if ($error): ?>
            <p class="error"><?php echo $error; ?></p>
        <?php endif; ?>
        <form method="POST">
            <div>
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div>
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
        </form>
    </div>
</body>
</html> 