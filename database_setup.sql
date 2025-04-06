-- SQL Script for Easter Egg Hunt 2025 Setup

-- Create the database (if it doesn't exist)
-- Replace 'easter_egg_hunt' if you used a different name in db_config.php
CREATE DATABASE IF NOT EXISTS easter_egg_hunt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the created database
USE easter_egg_hunt;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL UNIQUE, -- Navigator, Sage, Chronicler, Craftsman, Apprentice
    magic_token VARCHAR(255) NOT NULL UNIQUE, -- Secret token for login, initially same as role
    current_step VARCHAR(100) NOT NULL, -- Identifier for the current challenge/story step
    last_access TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert the initial user data
-- The initial 'current_step' will be the prologue story/challenge
-- We'll use 'prologue_intro' as the identifier for the starting point
INSERT INTO users (role, magic_token, current_step)
VALUES
    ('Navigator', 'Navigator', 'prologue_intro'),
    ('Sage', 'Sage', 'prologue_intro'),
    ('Chronicler', 'Chronicler', 'prologue_intro'),
    ('Craftsman', 'Craftsman', 'prologue_intro'),
    ('Apprentice', 'Apprentice', 'prologue_intro')
ON DUPLICATE KEY UPDATE
    -- Avoid errors if you run the script multiple times; doesn't update existing rows here
    role = VALUES(role); 