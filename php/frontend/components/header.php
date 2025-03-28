<?php
/**
 * Header component for Kingdom Hunt
 */
$isLoggedIn = isset($userData) && !empty($userData);
?>
<header>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">
                <img src="/frontend/assets/img/logo.png" alt="Kingdom Hunt" width="30" height="30" class="d-inline-block align-top me-2">
                Kingdom Hunt
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain" aria-controls="navbarMain" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarMain">
                <?php if ($isLoggedIn): ?>
                    <?php include_once FRONTEND_PATH . '/components/navigation.php'; ?>
                    
                    <div class="ms-auto d-flex align-items-center">
                        <span class="text-light me-3">
                            <i class="bi bi-person-circle"></i>
                            <?php echo htmlspecialchars($userData['name'] ?? $userData['user_id']); ?>
                        </span>
                        <a href="/?action=logout" class="btn btn-outline-light btn-sm">Logout</a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </nav>
</header>