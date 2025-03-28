<?php
/**
 * Main layout template for Kingdom Hunt
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle ?? 'Kingdom Hunt'; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/frontend/assets/css/styles.css">
    <?php if (isset($extraStyles)): ?>
        <?php foreach ($extraStyles as $style): ?>
            <link rel="stylesheet" href="<?php echo $style; ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body class="kingdom-hunt">
    <?php include_once FRONTEND_PATH . '/components/header.php'; ?>
    
    <main class="container my-4">
        <?php if (!empty($alertMessage)): ?>
            <div class="alert alert-<?php echo $alertType ?? 'info'; ?> alert-dismissible fade show" role="alert">
                <?php echo $alertMessage; ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>
        
        <?php if (isset($pageContent)): ?>
            <?php include_once $pageContent; ?>
        <?php endif; ?>
    </main>
    
    <?php include_once FRONTEND_PATH . '/components/footer.php'; ?>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/frontend/assets/js/main.js"></script>
    
    <?php if (isset($useSocketIO) && $useSocketIO): ?>
        <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
        <script src="/frontend/assets/js/socket-client.js"></script>
    <?php endif; ?>
    
    <?php if (isset($extraScripts)): ?>
        <?php foreach ($extraScripts as $script): ?>
            <script src="<?php echo $script; ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>