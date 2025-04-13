<?php
/**
 * Easter Egg Hunt 2025 - Setup Script
 * 
 * This script performs the following:
 * 1. Verifies PHP and MySQL requirements
 * 2. Creates database and tables
 * 3. Checks file permissions
 * 4. Tests multiplayer server connectivity (Node.js server)
 * 5. Provides next steps and troubleshooting
 */

// Prevent timeout for longer operations
set_time_limit(300);

// Error reporting for setup
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Store setup results
$results = [
    'system' => [],
    'database' => [],
    'files' => [],
    'node_server' => [],
    'final' => []
];

// Store global status
$setupComplete = true;

// Helper functions
function checkRequirement($name, $check, $required = true) {
    global $results, $setupComplete;
    $status = [
        'name' => $name,
        'status' => $check ? 'success' : ($required ? 'error' : 'warning'),
        'message' => $check ? 'OK' : ($required ? 'Required' : 'Recommended')
    ];
    
    if ($required && !$check) {
        $setupComplete = false;
    }
    
    return $status;
}

function getFormattedResults($results) {
    $html = '';
    foreach ($results as $result) {
        $class = $result['status'] === 'success' ? 'success' : ($result['status'] === 'error' ? 'danger' : 'warning');
        $icon = $result['status'] === 'success' ? '✓' : ($result['status'] === 'error' ? '✗' : '⚠');
        
        $html .= '<div class="alert alert-' . $class . '">';
        $html .= '<strong>' . $icon . ' ' . htmlspecialchars($result['name']) . ':</strong> ';
        $html .= htmlspecialchars($result['message']);
        $html .= '</div>';
    }
    return $html;
}

// =======================================================
// STEP 1: Check system requirements
// =======================================================
function checkSystemRequirements() {
    global $results;
    
    // PHP Version
    $results['system'][] = checkRequirement(
        'PHP Version (>= 7.4)', 
        version_compare(PHP_VERSION, '7.4.0', '>=')
    );
    
    // PHP Extensions
    $results['system'][] = checkRequirement(
        'PDO Extension', 
        extension_loaded('pdo')
    );
    
    $results['system'][] = checkRequirement(
        'PDO MySQL Extension', 
        extension_loaded('pdo_mysql')
    );
    
    $results['system'][] = checkRequirement(
        'JSON Extension', 
        extension_loaded('json')
    );
    
    $results['system'][] = checkRequirement(
        'Session Support', 
        extension_loaded('session')
    );
    
    // Directory permissions
    $baseDir = dirname(__DIR__);
    $publicDir = __DIR__;
    
    $results['system'][] = checkRequirement(
        'Base Directory Writable', 
        is_writable($baseDir),
        false
    );
    
    $results['system'][] = checkRequirement(
        'Public Directory Writable', 
        is_writable($publicDir),
        false
    );
}

// =======================================================
// STEP 2: Database setup
// =======================================================
function setupDatabase() {
    global $results;
    
    // Look for config file
    $configFile = dirname(__DIR__) . '/config/db_config.php';
    $configPresent = file_exists($configFile);
    
    $results['database'][] = checkRequirement(
        'Database Config File', 
        $configPresent
    );
    
    if (!$configPresent) {
        return;
    }
    
    // Include the config file
    require_once $configFile;
    
    // Try to connect to MySQL (without database)
    try {
        $dsn = 'mysql:host=' . DB_HOST;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        $results['database'][] = checkRequirement(
            'MySQL Connection', 
            true
        );
        
        // Check if database exists
        $dbExists = false;
        $stmt = $pdo->query("SHOW DATABASES LIKE '" . DB_NAME . "'");
        $dbExists = $stmt->rowCount() > 0;
        
        $results['database'][] = checkRequirement(
            'Database Exists', 
            $dbExists,
            false
        );
        
        // Create database if not exists
        if (!$dbExists) {
            try {
                $pdo->exec("CREATE DATABASE `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $results['database'][] = checkRequirement(
                    'Created Database', 
                    true
                );
            } catch (PDOException $e) {
                $results['database'][] = [
                    'name' => 'Created Database', 
                    'status' => 'error',
                    'message' => 'Error: ' . $e->getMessage()
                ];
                return;
            }
        }
        
        // Connect to the specific database
        try {
            $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS, $options);
            
            // Check if tables exist
            $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
            $tablesExist = $stmt->rowCount() > 0;
            
            $results['database'][] = checkRequirement(
                'Tables Exist', 
                $tablesExist,
                false
            );
            
            // Create tables if not exist
            if (!$tablesExist) {
                $sqlFile = dirname(__DIR__) . '/database_setup.sql';
                
                if (file_exists($sqlFile)) {
                    $sql = file_get_contents($sqlFile);
                    // Split SQL by semicolons
                    $commands = explode(';', $sql);
                    
                    try {
                        $pdo->beginTransaction();
                        
                        foreach ($commands as $command) {
                            $command = trim($command);
                            if (!empty($command)) {
                                $pdo->exec($command);
                            }
                        }
                        
                        $pdo->commit();
                        $results['database'][] = checkRequirement(
                            'Created Tables', 
                            true
                        );
                    } catch (PDOException $e) {
                        $pdo->rollBack();
                        $results['database'][] = [
                            'name' => 'Created Tables', 
                            'status' => 'error',
                            'message' => 'Error: ' . $e->getMessage()
                        ];
                    }
                } else {
                    $results['database'][] = [
                        'name' => 'SQL File', 
                        'status' => 'error',
                        'message' => 'database_setup.sql not found'
                    ];
                }
            }
            
        } catch (PDOException $e) {
            $results['database'][] = [
                'name' => 'Database Connection', 
                'status' => 'error',
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
        
    } catch (PDOException $e) {
        $results['database'][] = [
            'name' => 'MySQL Connection', 
            'status' => 'error',
            'message' => 'Error: ' . $e->getMessage()
        ];
    }
}

// =======================================================
// STEP 3: File checks and permissions
// =======================================================
function checkFiles() {
    global $results;
    
    $baseDir = dirname(__DIR__);
    
    // Check for critical directories
    $directories = [
        '/config',
        '/includes',
        '/public',
        '/public/challenges',
        '/public/story',
        '/public/assets',
        '/multiplayer_backend'
    ];
    
    foreach ($directories as $dir) {
        $path = $baseDir . $dir;
        $results['files'][] = checkRequirement(
            'Directory ' . $dir, 
            is_dir($path)
        );
    }
    
    // Check for critical files
    $files = [
        '/config/db_config.php',
        '/includes/auth.php',
        '/includes/db.php',
        '/includes/init.php',
        '/includes/steps.php',
        '/multiplayer_backend/server.js',
        '/public/index.php',
        '/public/complete.php',
        '/public/assets/style.css'
    ];
    
    foreach ($files as $file) {
        $path = $baseDir . $file;
        $results['files'][] = checkRequirement(
            'File ' . $file, 
            file_exists($path)
        );
    }
}

// =======================================================
// STEP 4: Check multiplayer server
// =======================================================
function checkNodeServer() {
    global $results;
    
    $nodeServerHost = 'localhost';
    $nodeServerPort = 3000; // Default port in server.js
    
    // Create a socket to test if the server is running
    $connection = @fsockopen($nodeServerHost, $nodeServerPort, $errno, $errstr, 5);
    $serverRunning = is_resource($connection);
    
    if ($serverRunning) {
        fclose($connection);
    }
    
    $results['node_server'][] = checkRequirement(
        'Multiplayer Server Running', 
        $serverRunning,
        false // Not strictly required for initial setup
    );
    
    if (!$serverRunning) {
        $nodeServerDir = dirname(__DIR__) . '/multiplayer_backend';
        $nodeServerFile = $nodeServerDir . '/server.js';
        
        $results['node_server'][] = [
            'name' => 'Node.js Server',
            'status' => 'warning',
            'message' => "Server not detected. Use the following command to start it:\n" .
                         "cd " . $nodeServerDir . " && node server.js"
        ];
    }
    
    // Add server.js file check
    $nodeServerFile = dirname(__DIR__) . '/multiplayer_backend/server.js';
    $results['node_server'][] = checkRequirement(
        'Server.js File', 
        file_exists($nodeServerFile)
    );
    
    // Add package.json check
    $packageFile = dirname(__DIR__) . '/multiplayer_backend/package.json';
    $results['node_server'][] = checkRequirement(
        'Package.json File', 
        file_exists($packageFile)
    );
}

// =======================================================
// STEP 5: Final checks and recommendations
// =======================================================
function finalChecks() {
    global $results, $setupComplete;
    
    // Provide URL links for the game
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'];
    $gameUrl = $protocol . $host;
    
    if ($setupComplete) {
        $results['final'][] = [
            'name' => 'Setup Status',
            'status' => 'success',
            'message' => 'Basic setup is complete. You can now access the game at: ' . $gameUrl
        ];
        
        $results['final'][] = [
            'name' => 'Player URLs',
            'status' => 'success',
            'message' => "Use these links for each player:\n" .
                         $gameUrl . "/?token=Navigator\n" .
                         $gameUrl . "/?token=Sage\n" .
                         $gameUrl . "/?token=Chronicler\n" .
                         $gameUrl . "/?token=Craftsman\n" .
                         $gameUrl . "/?token=Apprentice"
        ];
        
        $results['final'][] = [
            'name' => 'Admin Access',
            'status' => 'success',
            'message' => "Admin dashboard is available at:\n" .
                         $gameUrl . "/admin/login.php\n" .
                         "Username: admin, Password: password (change this in config/db_config.php)"
        ];
    } else {
        $results['final'][] = [
            'name' => 'Setup Status',
            'status' => 'error',
            'message' => 'Setup is incomplete. Please fix the issues above before proceeding.'
        ];
    }
    
    // Additional tips
    $results['final'][] = [
        'name' => 'Multiplayer Server',
        'status' => 'info',
        'message' => "Don't forget to start the Node.js multiplayer server:\n" .
                     "cd " . dirname(__DIR__) . "/multiplayer_backend && node server.js"
    ];
    
    $results['final'][] = [
        'name' => 'Security Note',
        'status' => 'warning',
        'message' => "For production, update the admin password in config/db_config.php"
    ];
}

// =======================================================
// Run all checks
// =======================================================
checkSystemRequirements();
setupDatabase();
checkFiles();
checkNodeServer();
finalChecks();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Easter Egg Hunt 2025 - Setup</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            padding: 20px;
            background-color: #f5f5f5;
        }
        .setup-container {
            max-width: 900px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0056b3;
            margin-bottom: 20px;
            text-align: center;
        }
        h2 {
            color: #0056b3;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #dee2e6;
        }
        .section {
            margin-bottom: 30px;
        }
        .alert {
            margin-bottom: 10px;
        }
        .setup-footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
        }
        code {
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 4px;
        }
        pre {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="setup-container">
        <h1>The Kingdom's Hunt - Setup</h1>
        
        <div class="alert alert-info">
            <strong>Welcome!</strong> This page will help you set up the Kingdom's Hunt Easter Egg Challenge.
        </div>
        
        <div class="section">
            <h2>1. System Requirements</h2>
            <?= getFormattedResults($results['system']) ?>
        </div>
        
        <div class="section">
            <h2>2. Database Setup</h2>
            <?= getFormattedResults($results['database']) ?>
        </div>
        
        <div class="section">
            <h2>3. File Structure Check</h2>
            <?= getFormattedResults($results['files']) ?>
        </div>
        
        <div class="section">
            <h2>4. Multiplayer Server</h2>
            <?= getFormattedResults($results['node_server']) ?>
            
            <div class="card mt-3">
                <div class="card-header">Start the Node.js Server</div>
                <div class="card-body">
                    <p>Open a terminal/command prompt and run:</p>
                    <pre>cd <?= dirname(__DIR__) ?>/multiplayer_backend
npm install
node server.js</pre>
                    <p class="mb-0">Keep this terminal window open while the game is running.</p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>5. Summary & Next Steps</h2>
            <?= getFormattedResults($results['final']) ?>
            
            <?php if ($setupComplete): ?>
            <div class="alert alert-success mt-3">
                <h4 class="alert-heading">Ready to Play!</h4>
                <p>The setup is complete. You can now access the game.</p>
                <hr>
                <p class="mb-0">Access the main page: <a href="/" class="alert-link">Go to Game</a></p>
            </div>
            <?php else: ?>
            <div class="alert alert-warning mt-3">
                <h4 class="alert-heading">Setup Incomplete</h4>
                <p>Please fix the issues above before proceeding.</p>
                <hr>
                <p class="mb-0">Refresh this page after making changes: <a href="" class="alert-link">Refresh Setup</a></p>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="setup-footer">
            <p>Once setup is complete, you can remove or restrict access to this setup.php file for security.</p>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>