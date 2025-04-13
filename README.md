# The Kingdom's Hunt - Easter Egg Challenge

This is a web-based interactive puzzle game with multiplayer elements designed for small groups to solve together.

## Quick Setup Guide

### 1. System Requirements

-   Web server with PHP 7.4+ (XAMPP, WAMP, or similar for local testing)
-   MySQL database
-   Node.js for the multiplayer server

### 2. Installation

#### Using XAMPP (Windows/Mac/Linux)

1. **Install XAMPP**: Download and install from [XAMPP website](https://www.apachefriends.org/)

2. **Extract Files**: Extract all files to `xampp/htdocs/hunt` or your preferred directory

3. **Start Services**:

    - Start Apache and MySQL services from XAMPP Control Panel

4. **Install Node.js Dependencies**:

    - Open a terminal/command prompt
    - Navigate to the `multiplayer_backend` directory
    - Run: `npm install`

5. **Run Automatic Setup**:

    - Open your browser and navigate to: `http://localhost/hunt/public/setup.php`
    - Follow the on-screen instructions to complete the setup
    - The setup script will:
        - Check PHP and MySQL requirements
        - Create the necessary database and tables
        - Verify file permissions and server settings
        - Test multiplayer server connection
        - Provide next steps

6. **Start the Multiplayer Server**:
    - Open a terminal/command prompt
    - Navigate to the `multiplayer_backend` directory
    - Run: `node server.js`
    - Keep this terminal window open while the game is running

### 3. Accessing the Game

-   **Main Game Page**: `http://localhost/hunt/public/`
-   **Player URLs**:
    -   Navigator: `http://localhost/hunt/public/?token=Navigator`
    -   Sage: `http://localhost/hunt/public/?token=Sage`
    -   Chronicler: `http://localhost/hunt/public/?token=Chronicler`
    -   Craftsman: `http://localhost/hunt/public/?token=Craftsman`
    -   Apprentice: `http://localhost/hunt/public/?token=Apprentice`
-   **Admin Dashboard**: `http://localhost/hunt/public/admin/login.php`
    -   Default credentials: Username: `admin`, Password: `password`
    -   **IMPORTANT:** Change the default password in `config/db_config.php`

## Detailed Setup Instructions

### Database Configuration

By default, the application uses these database settings:

-   Host: `localhost`
-   Database: `easter_egg_hunt`
-   Username: `root`
-   Password: `` (empty)

To change these settings, edit the `config/db_config.php` file.

### Multiplayer Server

The multiplayer server runs on Node.js and is required for challenges that involve coordination between players. It runs on port 3000 by default.

If you need to change the port, edit the `multiplayer_backend/server.js` file and update any references to this port in the challenge files.

### Admin Dashboard

The admin dashboard allows you to:

-   Monitor player progress
-   Manually move players between levels (useful if they get stuck)
-   Reset game state

### File Structure

```
/config/            - Configuration files
/includes/          - PHP backend logic
/multiplayer_backend/ - Node.js server for multiplayer challenges
/public/            - Publicly accessible files
  /admin/           - Admin dashboard
  /assets/          - CSS, JS, images
  /challenges/      - Challenge pages
  /story/           - Story narrative pages
  index.php         - Game entry point
  setup.php         - Setup script
```

## Troubleshooting

### Database Connection Issues

-   Verify MySQL is running
-   Check database credentials in `config/db_config.php`
-   Ensure the database exists

### Multiplayer Server Issues

-   Verify Node.js is installed
-   Check if the required packages are installed via `npm install`
-   Confirm port 3000 is not blocked or in use by another application
-   Check server logs in the terminal window

### File Permission Issues

-   Ensure web server has read access to all files
-   Ensure web server has write access to directories that need it

### Game Flow Issues

-   Use the admin dashboard to check player progress
-   Manually update player progress if needed

## Security Notes

-   Change the default admin password in `config/db_config.php`
-   After setup, consider restricting access to `setup.php`
-   For production use, consider using HTTPS
