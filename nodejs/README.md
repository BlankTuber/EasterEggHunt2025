# Kingdom Hunt Socket.io Backend

This is the Socket.io backend server for the Kingdom Hunt game, providing real-time communication for multiplayer challenges and convergence points.

## Features

- Real-time communication between players
- Challenge handlers for various multiplayer puzzles:
  - Introduction Challenge
  - Sequence Puzzle (first major convergence)
  - Trivia Challenges (3 different groups)
  - Geocaching Challenge
  - Cross Device Puzzle
  - Digital Escape Room (middle convergence)
  - Combine Codes Challenge (final convergence)
- Integration with PHP backend for user authentication and progress tracking
- API endpoints for notifications and status monitoring

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- A running instance of the PHP backend

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd kingdom-hunt-socketio
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your own configuration settings:
   - Set a secure API_KEY
   - Configure the PHP_BACKEND_URL to point to your PHP backend
   - Adjust the PORT if needed

## Running the Server

### Development Mode

```
npm run dev
```

This will start the server with nodemon, which automatically restarts when changes are detected.

### Production Mode

```
npm start
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /status` - Get server status (requires API key)
- `POST /notify` - Endpoint for the PHP backend to send notifications (requires API key)

## Socket.io Events

Each challenge has its own set of events. Here are some common patterns:

- `authenticate` - Authenticate the user with a JWT token
- `join_challenge` - Join a specific challenge
- `challenge_action` - Perform an action within a challenge
- `complete_challenge` - Mark a challenge as completed

For detailed information on events specific to each challenge type, refer to the individual challenge handler files.

## Deployment

For production deployment, you may want to use a process manager like PM2:

```
npm install -g pm2
pm2 start server.js --name kingdom-hunt-socketio
```

## Integration with PHP Backend

This Socket.io server is designed to work in conjunction with the Kingdom Hunt PHP backend. The PHP backend will:

1. Authenticate users
2. Track challenge progress
3. Send notifications to the Socket.io server when challenges are unlocked or completed
4. Receive updates from the Socket.io server when users complete challenges

## Folder Structure

- `server.js` - Main entry point
- `challenges/` - Individual challenge handlers
  - `introChallenge.js` - Introduction challenge
  - `sequencePuzzle.js` - First major convergence challenge
  - `triviaGroupA.js` - Trivia for Sage, Chronicler, and Apprentice (common knowledge)
  - `triviaGroupB.js` - Trivia for Sage, Chronicler, and Apprentice (specialized knowledge)
  - `triviaGroupC.js` - Trivia for Navigator and Craftsman (tech-related)
  - `geocaching.js` - Geocaching for Navigator and Craftsman
  - `crossDevicePuzzle.js` - Mechanical puzzle for Craftsman and Apprentice
  - `digitalEscapeRoom.js` - Middle convergence for all five champions
  - `combineCodes.js` - Final convergence challenge

## Security Considerations

- The API_KEY is used to secure communication between the PHP backend and this Socket.io server
- User authentication is handled by validating JWT tokens with the PHP backend
- Ensure your production setup uses HTTPS for secure communication
