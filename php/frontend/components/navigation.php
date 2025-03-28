<?php
/**
 * Navigation component for Kingdom Hunt
 */
$currentPage = $_GET['page'] ?? 'dashboard';
?>
<ul class="navbar-nav">
    <li class="nav-item">
        <a class="nav-link <?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>" href="/?page=dashboard">
            Dashboard
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link <?php echo $currentPage === 'challenge' ? 'active' : ''; ?>" href="/?page=challenge">
            Current Challenge
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link <?php echo $currentPage === 'story' ? 'active' : ''; ?>" href="/?page=story">
            Story
        </a>
    </li>
    <?php if (isset($userData['current_path']) && strpos($userData['current_path'], 'convergence') !== false): ?>
    <li class="nav-item">
        <a class="nav-link <?php echo $currentPage === 'convergence' ? 'active' : ''; ?>" href="/?page=convergence">
            Convergence
        </a>
    </li>
    <?php endif; ?>
</ul>