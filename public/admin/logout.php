<?php
require_once __DIR__ . '/../../includes/init.php'; // Use init for session start

logout_admin(); // Call the admin logout function

// Redirect to login page
header('Location: /admin/login.php?logged_out=true');
exit;

?> 