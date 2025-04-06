<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php'; // To potentially check roles if needed

// Define the sequence of steps for each role
// Structure: 'step_id' => ['type' => 'challenge'/'story'/'convergence', 'path' => 'relative/path/to/file.php', 'next_step' => 'next_step_id']
// Convergence points might have special handling or shared paths.

$progression = [
    'Navigator' => [
        'prologue_intro' => ['type' => 'story', 'path' => 'story/prologue_intro.php', 'next_step' => 'prologue_challenge'], // Shared prologue story
        'prologue_challenge' => ['type' => 'challenge', 'path' => 'challenges/prologue_sequence/index.php', 'next_step' => 'navigator_story_1'], // Shared prologue challenge (assuming a dir)
        'navigator_story_1' => ['type' => 'story', 'path' => 'story/navigator_path_1.php', 'next_step' => 'challenge_pong'],
        'challenge_pong' => ['type' => 'challenge', 'path' => 'challenges/pong/index.php', 'next_step' => 'navigator_story_2'],
        'navigator_story_2' => ['type' => 'story', 'path' => 'story/navigator_path_2.php', 'next_step' => 'challenge_math_sequence'],
        'challenge_math_sequence' => ['type' => 'challenge', 'path' => 'challenges/mathsequence/index.php', 'next_step' => 'navigator_story_3'], // Leads to convergence hint
        'navigator_story_3' => ['type' => 'story', 'path' => 'story/navigator_path_3.php', 'next_step' => 'convergence_geocaching'], // Story before geocaching
        'convergence_geocaching' => ['type' => 'convergence', 'path' => 'challenges/convergence_geocaching/index.php', 'next_step' => 'navigator_story_4', 'participants' => ['Navigator', 'Craftsman']], // Example convergence
        'navigator_story_4' => ['type' => 'story', 'path' => 'story/navigator_path_4.php', 'next_step' => 'challenge_tech_timeline'],
        'challenge_tech_timeline' => ['type' => 'challenge', 'path' => 'challenges/timeline/navigator.php', 'next_step' => 'middle_convergence_story'], // Path ends, leads to middle convergence
        // --- Add Second Journey & Convergences ---
        'middle_convergence_story' => ['type' => 'story', 'path' => 'story/middle_convergence.php', 'next_step' => 'middle_convergence_challenge'],
        'middle_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/middle_escape_room/index.php', 'next_step' => 'navigator_story_5', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'navigator_story_5' => ['type' => 'story', 'path' => 'story/navigator_path_5.php', 'next_step' => 'challenge_music'],
        'challenge_music' => ['type' => 'challenge', 'path' => 'challenges/music/index.php', 'next_step' => 'navigator_story_6'],
        'navigator_story_6' => ['type' => 'story', 'path' => 'story/navigator_path_6.php', 'next_step' => 'challenge_memory'],
        'challenge_memory' => ['type' => 'challenge', 'path' => 'challenges/memory/index.php', 'next_step' => 'navigator_story_7'],
        'navigator_story_7' => ['type' => 'story', 'path' => 'story/navigator_path_7.php', 'next_step' => 'challenge_birthdays'],
        'challenge_birthdays' => ['type' => 'challenge', 'path' => 'challenges/birthdays/index.php', 'next_step' => 'convergence_trivia_c_story'], // Leads to Trivia C hint
        'convergence_trivia_c_story' => ['type' => 'story', 'path' => 'story/navigator_path_trivia_c.php', 'next_step' => 'convergence_trivia_c'],
        'convergence_trivia_c' => ['type' => 'convergence', 'path' => 'challenges/convergence_trivia_c/index.php', 'next_step' => 'final_convergence_story', 'participants' => ['Navigator', 'Craftsman']],
        'final_convergence_story' => ['type' => 'story', 'path' => 'story/final_convergence.php', 'next_step' => 'final_convergence_challenge'],
        'final_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/final_code_combine/index.php', 'next_step' => 'epilogue', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'epilogue' => ['type' => 'story', 'path' => 'story/epilogue.php', 'next_step' => 'completed'], // Final story
        'completed' => ['type' => 'end', 'path' => 'completed.php', 'next_step' => null] // End state
    ],
    'Sage' => [
        'prologue_intro' => ['type' => 'story', 'path' => 'story/prologue_intro.php', 'next_step' => 'prologue_challenge'],
        'prologue_challenge' => ['type' => 'challenge', 'path' => 'challenges/prologue_sequence/index.php', 'next_step' => 'sage_story_1'],
        'sage_story_1' => ['type' => 'story', 'path' => 'story/sage_path_1.php', 'next_step' => 'challenge_crossword'],
        'challenge_crossword' => ['type' => 'challenge', 'path' => 'challenges/crossword/index.php', 'next_step' => 'sage_story_2'], // MISSING DIR?
        'sage_story_2' => ['type' => 'story', 'path' => 'story/sage_path_2.php', 'next_step' => 'challenge_cipher'],
        'challenge_cipher' => ['type' => 'challenge', 'path' => 'challenges/cipher/index.php', 'next_step' => 'convergence_trivia_a_story'], // Leads to Trivia A hint
        'convergence_trivia_a_story' => ['type' => 'story', 'path' => 'story/sage_path_trivia_a.php', 'next_step' => 'convergence_trivia_a'],
        'convergence_trivia_a' => ['type' => 'convergence', 'path' => 'challenges/convergence_trivia_a/index.php', 'next_step' => 'sage_story_3', 'participants' => ['Sage', 'Chronicler', 'Apprentice']],
        'sage_story_3' => ['type' => 'story', 'path' => 'story/sage_path_3.php', 'next_step' => 'challenge_jigsaw'],
        'challenge_jigsaw' => ['type' => 'challenge', 'path' => 'challenges/jigsaw/index.php', 'next_step' => 'middle_convergence_story'], // MISSING
        // --- Add Second Journey & Convergences ---
        'middle_convergence_story' => ['type' => 'story', 'path' => 'story/middle_convergence.php', 'next_step' => 'middle_convergence_challenge'],
        'middle_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/middle_escape_room/index.php', 'next_step' => 'sage_story_4', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'sage_story_4' => ['type' => 'story', 'path' => 'story/sage_path_4.php', 'next_step' => 'challenge_color_sequence'],
        'challenge_color_sequence' => ['type' => 'challenge', 'path' => 'challenges/colorsequence/index.php', 'next_step' => 'sage_story_5'],
        'sage_story_5' => ['type' => 'story', 'path' => 'story/sage_path_5.php', 'next_step' => 'challenge_house_riddles'], // Leads to house hunt hint
        'challenge_house_riddles' => ['type' => 'challenge', 'path' => 'challenges/house_hunt_riddles/index.php', 'next_step' => 'sage_story_6'], // MISSING
        'sage_story_6' => ['type' => 'story', 'path' => 'story/sage_path_6.php', 'next_step' => 'challenge_word_search'],
        'challenge_word_search' => ['type' => 'challenge', 'path' => 'challenges/wordsearch/index.php', 'next_step' => 'convergence_trivia_b_story'], // MISSING
        'convergence_trivia_b_story' => ['type' => 'story', 'path' => 'story/sage_path_trivia_b.php', 'next_step' => 'convergence_trivia_b'],
        'convergence_trivia_b' => ['type' => 'convergence', 'path' => 'challenges/convergence_trivia_b/index.php', 'next_step' => 'final_convergence_story', 'participants' => ['Sage', 'Chronicler', 'Apprentice']],
        'final_convergence_story' => ['type' => 'story', 'path' => 'story/final_convergence.php', 'next_step' => 'final_convergence_challenge'],
        'final_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/final_code_combine/index.php', 'next_step' => 'epilogue', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'epilogue' => ['type' => 'story', 'path' => 'story/epilogue.php', 'next_step' => 'completed'],
        'completed' => ['type' => 'end', 'path' => 'completed.php', 'next_step' => null]
    ],
    'Chronicler' => [
        'prologue_intro' => ['type' => 'story', 'path' => 'story/prologue_intro.php', 'next_step' => 'prologue_challenge'],
        'prologue_challenge' => ['type' => 'challenge', 'path' => 'challenges/prologue_sequence/index.php', 'next_step' => 'chronicler_story_1'],
        'chronicler_story_1' => ['type' => 'story', 'path' => 'story/chronicler_path_1.php', 'next_step' => 'challenge_trend_timeline'],
        'challenge_trend_timeline' => ['type' => 'challenge', 'path' => 'challenges/timeline/chronicler.php', 'next_step' => 'chronicler_story_2'],
        'chronicler_story_2' => ['type' => 'story', 'path' => 'story/chronicler_path_2.php', 'next_step' => 'challenge_workout'],
        'challenge_workout' => ['type' => 'challenge', 'path' => 'challenges/workout/index.php', 'next_step' => 'convergence_trivia_a_story'], // Leads to Trivia A hint
        'convergence_trivia_a_story' => ['type' => 'story', 'path' => 'story/chronicler_path_trivia_a.php', 'next_step' => 'convergence_trivia_a'],
        'convergence_trivia_a' => ['type' => 'convergence', 'path' => 'challenges/convergence_trivia_a/index.php', 'next_step' => 'chronicler_story_3', 'participants' => ['Sage', 'Chronicler', 'Apprentice']],
        'chronicler_story_3' => ['type' => 'story', 'path' => 'story/chronicler_path_3.php', 'next_step' => 'challenge_emojis'],
        'challenge_emojis' => ['type' => 'challenge', 'path' => 'challenges/emojis/index.php', 'next_step' => 'middle_convergence_story'],
        // --- Add Second Journey & Convergences ---
        'middle_convergence_story' => ['type' => 'story', 'path' => 'story/middle_convergence.php', 'next_step' => 'middle_convergence_challenge'],
        'middle_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/middle_escape_room/index.php', 'next_step' => 'chronicler_story_4', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'chronicler_story_4' => ['type' => 'story', 'path' => 'story/chronicler_path_4.php', 'next_step' => 'challenge_brand_logos'],
        'challenge_brand_logos' => ['type' => 'challenge', 'path' => 'challenges/silhouette/chronicler.php', 'next_step' => 'chronicler_story_5'], // MISSING DIR?
        'chronicler_story_5' => ['type' => 'story', 'path' => 'story/chronicler_path_5.php', 'next_step' => 'challenge_sliding_puzzle'],
        'challenge_sliding_puzzle' => ['type' => 'challenge', 'path' => 'challenges/sliding_puzzle/index.php', 'next_step' => 'convergence_trivia_b_story'], // MISSING
        'convergence_trivia_b_story' => ['type' => 'story', 'path' => 'story/chronicler_path_trivia_b.php', 'next_step' => 'convergence_trivia_b'],
        'convergence_trivia_b' => ['type' => 'convergence', 'path' => 'challenges/convergence_trivia_b/index.php', 'next_step' => 'chronicler_story_6', 'participants' => ['Sage', 'Chronicler', 'Apprentice']],
        'chronicler_story_6' => ['type' => 'story', 'path' => 'story/chronicler_path_6.php', 'next_step' => 'challenge_color_mixer'],
        'challenge_color_mixer' => ['type' => 'challenge', 'path' => 'challenges/colormixer/index.php', 'next_step' => 'final_convergence_story'],
        'final_convergence_story' => ['type' => 'story', 'path' => 'story/final_convergence.php', 'next_step' => 'final_convergence_challenge'],
        'final_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/final_code_combine/index.php', 'next_step' => 'epilogue', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'epilogue' => ['type' => 'story', 'path' => 'story/epilogue.php', 'next_step' => 'completed'],
        'completed' => ['type' => 'end', 'path' => 'completed.php', 'next_step' => null]
    ],
    'Craftsman' => [
        'prologue_intro' => ['type' => 'story', 'path' => 'story/prologue_intro.php', 'next_step' => 'prologue_challenge'],
        'prologue_challenge' => ['type' => 'challenge', 'path' => 'challenges/prologue_sequence/index.php', 'next_step' => 'craftsman_story_1'],
        'craftsman_story_1' => ['type' => 'story', 'path' => 'story/craftsman_path_1.php', 'next_step' => 'challenge_football_logos'],
        'challenge_football_logos' => ['type' => 'challenge', 'path' => 'challenges/silhouette/craftsman.php', 'next_step' => 'craftsman_story_2'],
        'craftsman_story_2' => ['type' => 'story', 'path' => 'story/craftsman_path_2.php', 'next_step' => 'convergence_geocaching'], // Leads to convergence hint
        'convergence_geocaching' => ['type' => 'convergence', 'path' => 'challenges/convergence_geocaching/index.php', 'next_step' => 'craftsman_story_3', 'participants' => ['Navigator', 'Craftsman']],
        'craftsman_story_3' => ['type' => 'story', 'path' => 'story/craftsman_path_3.php', 'next_step' => 'challenge_morse'],
        'challenge_morse' => ['type' => 'challenge', 'path' => 'challenges/morse/index.php', 'next_step' => 'convergence_cross_device_mech_story'], // Leads to cross-device hint
        'convergence_cross_device_mech_story' => ['type' => 'story', 'path' => 'story/craftsman_path_cross_device.php', 'next_step' => 'convergence_cross_device_mech'],
        'convergence_cross_device_mech' => ['type' => 'convergence', 'path' => 'challenges/convergence_cross_device_mech/index.php', 'next_step' => 'middle_convergence_story', 'participants' => ['Craftsman', 'Apprentice']], // MISSING
        // --- Add Second Journey & Convergences ---
        'middle_convergence_story' => ['type' => 'story', 'path' => 'story/middle_convergence.php', 'next_step' => 'middle_convergence_challenge'],
        'middle_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/middle_escape_room/index.php', 'next_step' => 'craftsman_story_4', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'craftsman_story_4' => ['type' => 'story', 'path' => 'story/craftsman_path_4.php', 'next_step' => 'challenge_word_scramble'],
        'challenge_word_scramble' => ['type' => 'challenge', 'path' => 'challenges/wordscramble/index.php', 'next_step' => 'craftsman_story_5'],
        'craftsman_story_5' => ['type' => 'story', 'path' => 'story/craftsman_path_5.php', 'next_step' => 'challenge_house_description'], // Leads to house hunt hint
        'challenge_house_description' => ['type' => 'challenge', 'path' => 'challenges/house_hunt_description/index.php', 'next_step' => 'craftsman_story_6'], // MISSING
        'craftsman_story_6' => ['type' => 'story', 'path' => 'story/craftsman_path_6.php', 'next_step' => 'challenge_hangman'],
        'challenge_hangman' => ['type' => 'challenge', 'path' => 'challenges/hangman/index.php', 'next_step' => 'convergence_trivia_c_story'], // Leads to Trivia C hint
        'convergence_trivia_c_story' => ['type' => 'story', 'path' => 'story/craftsman_path_trivia_c.php', 'next_step' => 'convergence_trivia_c'],
        'convergence_trivia_c' => ['type' => 'convergence', 'path' => 'challenges/convergence_trivia_c/index.php', 'next_step' => 'final_convergence_story', 'participants' => ['Navigator', 'Craftsman']],
        'final_convergence_story' => ['type' => 'story', 'path' => 'story/final_convergence.php', 'next_step' => 'final_convergence_challenge'],
        'final_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/final_code_combine/index.php', 'next_step' => 'epilogue', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'epilogue' => ['type' => 'story', 'path' => 'story/epilogue.php', 'next_step' => 'completed'],
        'completed' => ['type' => 'end', 'path' => 'completed.php', 'next_step' => null]
    ],
    'Apprentice' => [
        'prologue_intro' => ['type' => 'story', 'path' => 'story/prologue_intro.php', 'next_step' => 'prologue_challenge'],
        'prologue_challenge' => ['type' => 'challenge', 'path' => 'challenges/prologue_sequence/index.php', 'next_step' => 'apprentice_story_1'],
        'apprentice_story_1' => ['type' => 'story', 'path' => 'story/apprentice_path_1.php', 'next_step' => 'challenge_game_chars'],
        'challenge_game_chars' => ['type' => 'challenge', 'path' => 'challenges/silhouette/apprentice.php', 'next_step' => 'convergence_trivia_a_story'], // Leads to Trivia A hint
        'convergence_trivia_a_story' => ['type' => 'story', 'path' => 'story/apprentice_path_trivia_a.php', 'next_step' => 'convergence_trivia_a'],
        'convergence_trivia_a' => ['type' => 'convergence', 'path' => 'challenges/convergence_trivia_a/index.php', 'next_step' => 'apprentice_story_2', 'participants' => ['Sage', 'Chronicler', 'Apprentice']],
        'apprentice_story_2' => ['type' => 'story', 'path' => 'story/apprentice_path_2.php', 'next_step' => 'challenge_game_timeline'],
        'challenge_game_timeline' => ['type' => 'challenge', 'path' => 'challenges/timeline/apprentice.php', 'next_step' => 'convergence_cross_device_mech_story'], // Leads to cross-device hint
        'convergence_cross_device_mech_story' => ['type' => 'story', 'path' => 'story/apprentice_path_cross_device.php', 'next_step' => 'convergence_cross_device_mech'],
        'convergence_cross_device_mech' => ['type' => 'convergence', 'path' => 'challenges/convergence_cross_device_mech/index.php', 'next_step' => 'middle_convergence_story', 'participants' => ['Craftsman', 'Apprentice']], // MISSING
        // --- Add Second Journey & Convergences ---
        'middle_convergence_story' => ['type' => 'story', 'path' => 'story/middle_convergence.php', 'next_step' => 'middle_convergence_challenge'],
        'middle_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/middle_escape_room/index.php', 'next_step' => 'apprentice_story_3', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'apprentice_story_3' => ['type' => 'story', 'path' => 'story/apprentice_path_3.php', 'next_step' => 'challenge_roblox'],
        'challenge_roblox' => ['type' => 'challenge', 'path' => 'challenges/roblox/index.php', 'next_step' => 'apprentice_story_4'], // MISSING
        'apprentice_story_4' => ['type' => 'story', 'path' => 'story/apprentice_path_4.php', 'next_step' => 'challenge_wackamole'],
        'challenge_wackamole' => ['type' => 'challenge', 'path' => 'challenges/wack-a-mole/index.php', 'next_step' => 'convergence_trivia_b_story'], // Leads to Trivia B hint
        'convergence_trivia_b_story' => ['type' => 'story', 'path' => 'story/apprentice_path_trivia_b.php', 'next_step' => 'convergence_trivia_b'],
        'convergence_trivia_b' => ['type' => 'convergence', 'path' => 'challenges/convergence_trivia_b/index.php', 'next_step' => 'apprentice_story_5', 'participants' => ['Sage', 'Chronicler', 'Apprentice']],
        'apprentice_story_5' => ['type' => 'story', 'path' => 'story/apprentice_path_5.php', 'next_step' => 'challenge_wordle'],
        'challenge_wordle' => ['type' => 'challenge', 'path' => 'challenges/wordle/index.php', 'next_step' => 'final_convergence_story'],
        'final_convergence_story' => ['type' => 'story', 'path' => 'story/final_convergence.php', 'next_step' => 'final_convergence_challenge'],
        'final_convergence_challenge' => ['type' => 'convergence', 'path' => 'challenges/final_code_combine/index.php', 'next_step' => 'epilogue', 'participants' => ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']],
        'epilogue' => ['type' => 'story', 'path' => 'story/epilogue.php', 'next_step' => 'completed'],
        'completed' => ['type' => 'end', 'path' => 'completed.php', 'next_step' => null]
    ],
];

/**
 * Gets the complete progression map.
 *
 * @global array $progression
 * @return array
 */
function get_progression_map(): array {
    global $progression;
    return $progression;
}

/**
 * Gets the user's current step details from the database.
 *
 * @param string $role
 * @return string|null
 */
function get_current_step_id(string $role): ?string {
    $pdo = get_db_connection();
    if (!$pdo) return null;

    try {
        $stmt = $pdo->prepare("SELECT current_step FROM users WHERE role = :role");
        $stmt->execute(['role' => $role]);
        $result = $stmt->fetchColumn();
        return $result ?: null;
    } catch (PDOException $e) {
        error_log("Error fetching current step for role {$role}: " . $e->getMessage());
        return null;
    }
}

/**
 * Gets the details (type, path, next_step) for a specific step ID and role.
 *
 * @param string $role
 * @param string $step_id
 * @return array|null
 */
function get_step_details(string $role, string $step_id): ?array {
    $progression = get_progression_map();
    return $progression[$role][$step_id] ?? null;
}

/**
 * Gets the full URL path for a given step ID and role, relative to the web root.
 *
 * @param string $role
 * @param string $step_id
 * @return string|null
 */
function get_step_url(string $role, string $step_id): ?string {
    $details = get_step_details($role, $step_id);
    if ($details && isset($details['path'])) {
        // Assumes the web server document root is the 'public' directory
        // The path stored in $progression is relative to 'public'
        return '/' . ltrim($details['path'], '/'); // e.g., /challenges/pong/index.php
    }
    return null;
}

/**
 * Updates the user's current step in the database.
 *
 * @param string $role
 * @param string $new_step_id
 * @return bool True on success, false on failure.
 */
function update_user_step(string $role, string $new_step_id): bool {
    $pdo = get_db_connection();
    if (!$pdo) return false;

    try {
        $stmt = $pdo->prepare("UPDATE users SET current_step = :step WHERE role = :role");
        $stmt->execute(['step' => $new_step_id, 'role' => $role]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        error_log("Error updating step for role {$role} to {$new_step_id}: " . $e->getMessage());
        return false;
    }
}

/**
 * Checks if a user is allowed to access a specific step.
 *
 * @param string $role The user's role.
 * @param string $requested_step_id The step ID the user is trying to access.
 * @return bool True if allowed, false otherwise.
 */
function can_access_step(string $role, string $requested_step_id): bool {
    $current_step_id = get_current_step_id($role);
    if (!$current_step_id) {
        return false; // Cannot determine current step
    }
    // Allow access only if the requested step is the user's current step
    return $current_step_id === $requested_step_id;
}

/**
 * Redirects the user to their correct current step page.
 */
function redirect_to_current_step(): void {
    if (!is_logged_in()) {
        // Redirect to the root (which is public/index.php, the login handler)
        header("Location: /index.php?error=not_logged_in");
        exit;
    }

    $role = get_user_role();
    $current_step_id = get_current_step_id($role);

    if (!$current_step_id) {
        // Handle error - maybe logout or show error page
        logout();
        header("Location: /index.php?error=cannot_get_step");
        exit;
    }

    // Handle the final 'completed' state
    if ($current_step_id === 'completed') {
        $completed_url = '/completed.php'; // Path relative to public root
        // Prevent redirect loop if already on the completed page
        $current_request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        if ($current_request_uri !== $completed_url) {
            header("Location: " . $completed_url);
            exit;
        }
        return; // Already on the correct page, nothing more to do
    }

    $url = get_step_url($role, $current_step_id);

    if ($url) {
        // Prevent redirect loops if already on the correct page
        $current_request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        if ($current_request_uri !== $url) {
            header("Location: " . $url);
            exit;
        }
        // If already on the correct page, do nothing
    } else {
        // Handle error - step defined but no URL?
        // Could also happen if $current_step_id is valid but not in the $progression map for the role
        logout(); // Log out to prevent potential issues
        header("Location: /index.php?error=invalid_step&step=" . urlencode($current_step_id));
        exit;
        // die("Error: Could not determine the correct page URL for your current step ({$current_step_id}). Contact the administrator.");
    }
}

?> 