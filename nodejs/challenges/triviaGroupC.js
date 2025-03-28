/**
 * Trivia Group C Challenge Handler
 * 
 * Convergence challenge for Navigator and Craftsman
 * focusing on tech-related questions.
 */

let io;

// Initialize the challenge handler
function initialize(socketIo) {
  io = socketIo;
}

// Challenge state for each room
const roomStates = {};

// Questions database for tech-related trivia
const triviaQuestions = [
  {
    question: "Which of these is not a programming language?",
    options: ["Java", "Python", "Ruby", "Cougar"],
    correctAnswer: 3,
    category: "Programming"
  },
  {
    question: "What does CPU stand for?",
    options: ["Central Processing Unit", "Computer Personal Unit", "Central Process Uniformity", "Calculated Processing Utility"],
    correctAnswer: 0,
    category: "Hardware"
  },
  {
    question: "Which company developed the first commercially available GUI?",
    options: ["Microsoft", "Apple", "Xerox", "IBM"],
    correctAnswer: 2,
    category: "Computing History"
  },
  {
    question: "What is the standard port number for HTTP?",
    options: ["21", "80", "443", "8080"],
    correctAnswer: 1,
    category: "Networking"
  },
  {
    question: "What type of data structure uses LIFO (Last In, First Out)?",
    options: ["Queue", "Stack", "Linked List", "Binary Tree"],
    correctAnswer: 1,
    category: "Data Structures"
  },
  {
    question: "Which material is used to make semiconductors in computer chips?",
    options: ["Gold", "Copper", "Silicon", "Aluminum"],
    correctAnswer: 2,
    category: "Materials"
  },
  {
    question: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "High Tech Multi Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"],
    correctAnswer: 0,
    category: "Web Development"
  },
  {
    question: "Which of these is a version control system?",
    options: ["MySQL", "MongoDB", "Git", "Node.js"],
    correctAnswer: 2,
    category: "Software Development"
  },
  {
    question: "Which protocol is used for secure web browsing?",
    options: ["HTTP", "FTP", "SMTP", "HTTPS"],
    correctAnswer: 3,
    category: "Networking"
  },
  {
    question: "What was the first widely-used web browser?",
    options: ["Internet Explorer", "Netscape Navigator", "Mozilla Firefox", "Google Chrome"],
    correctAnswer: 1,
    category: "Internet History"
  }
];

// Function to select random questions
function selectRandomQuestions(count) {
  const shuffled = [...triviaQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Handle a user joining the challenge
function onJoin(socket, data) {
  const { userId, roomId, users } = data;
  
  // Initialize room state if not exists
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      questions: selectRandomQuestions(5), // 5 questions for this challenge
      currentQuestion: 0,
      answers: {},
      scores: {},
      userReady: {},
      started: false,
      completed: false,
      timePerQuestion: 20, // seconds
      timers: {},
      // For this challenge, players alternate answering
      activePlayer: null,
      playerOrder: []
    };
    
    // Initialize scores for all users
    users.forEach(user => {
      roomStates[roomId].scores[user] = 0;
      roomStates[roomId].userReady[user] = false;
    });
    
    // Set player order (randomized)
    roomStates[roomId].playerOrder = [...users].sort(() => 0.5 - Math.random());
  }
  
  // Send initial state to the user
  socket.emit('trivia_c_init', {
    userId,
    users,
    totalQuestions: roomStates[roomId].questions.length,
    message: "Welcome to the Tech Trivia Challenge! As the Navigator and Craftsman, you must combine your technical knowledge."
  });
  
  // Notify room that a new user has joined
  io.to(roomId).emit('trivia_c_user_joined', {
    userId,
    totalUsers: users.length
  });
}

// Start the timer for a question
function startQuestionTimer(roomId) {
  const state = roomStates[roomId];
  
  // Clear any existing timer
  if (state.timers.question) {
    clearTimeout(state.timers.question);
  }
  
  // Set timeout for question
  state.timers.question = setTimeout(() => {
    // Time's up, move to next player
    io.to(roomId).emit('trivia_c_time_up', {
      questionNumber: state.currentQuestion + 1,
      activePlayer: state.activePlayer,
      correctAnswer: state.questions[state.currentQuestion].correctAnswer
    });
    
    // Move to next player or next question
    handleNextPlayerOrQuestion(roomId);
  }, state.timePerQuestion * 1000);
}

// Move to next player or next question
function handleNextPlayerOrQuestion(roomId) {
  const state = roomStates[roomId];
  
  // Calculate current player index
  const currentIndex = state.playerOrder.indexOf(state.activePlayer);
  const nextIndex = (currentIndex + 1) % state.playerOrder.length;
  
  // If we've gone through all players for this question, move to next question
  if (nextIndex === 0) {
    state.currentQuestion++;
  }
  
  // Check if we've finished all questions
  if (state.currentQuestion >= state.questions.length) {
    // End the game
    endGame(roomId);
    return;
  }
  
  // Set next active player
  state.activePlayer = state.playerOrder[nextIndex];
  
  // Send question to new active player after a delay
  state.timers.next = setTimeout(() => {
    io.to(roomId).emit('trivia_c_question', {
      questionNumber: state.currentQuestion + 1,
      totalQuestions: state.questions.length,
      question: state.questions[state.currentQuestion].question,
      options: state.questions[state.currentQuestion].options,
      category: state.questions[state.currentQuestion].category,
      timeLimit: state.timePerQuestion,
      activePlayer: state.activePlayer
    });
    
    // Start timer for this player's turn
    startQuestionTimer(roomId);
  }, 2000);
}

// End the trivia game
function endGame(roomId) {
  const state = roomStates[roomId];
  
  state.completed = true;
  
  // Calculate total score
  const totalScore = Object.values(state.scores).reduce((sum, score) => sum + score, 0);
  const maxPossibleScore = state.questions.length;
  
  // Calculate success percentage
  const successPercentage = Math.round((totalScore / maxPossibleScore) * 100);
  
  // Determine if challenge is passed (>= 60% correct)
  const passed = successPercentage >= 60;
  
  io.to(roomId).emit('trivia_c_complete', {
    scores: state.scores,
    totalScore,
    maxPossibleScore,
    successPercentage,
    passed,
    message: passed 
      ? "Your technical expertise has unlocked the secrets of this realm!"
      : "The technological marvels remain beyond your grasp. Try again!"
  });
  
  // Clear all timers
  Object.values(state.timers).forEach(timer => {
    clearTimeout(timer);
  });
  state.timers = {};
}

// Handle user actions
function onAction(socket, data) {
  const { userId, roomId, action, payload } = data;
  
  if (!roomStates[roomId]) {
    socket.emit('error', { message: "Room not initialized" });
    return;
  }
  
  const state = roomStates[roomId];
  
  switch (action) {
    case 'ready':
      // Mark player as ready
      state.userReady[userId] = true;
      
      // Check if all players are ready
      const allReady = Object.keys(state.userReady).every(id => state.userReady[id]);
      
      // Notify room about player readiness
      io.to(roomId).emit('trivia_c_user_ready', {
        userId,
        readyCount: Object.values(state.userReady).filter(ready => ready).length,
        totalUsers: Object.keys(state.userReady).length
      });
      
      if (allReady && !state.started) {
        // Start the trivia game
        state.started = true;
        
        // Set first active player
        state.activePlayer = state.playerOrder[0];
        
        // Send first question
        io.to(roomId).emit('trivia_c_question', {
          questionNumber: state.currentQuestion + 1,
          totalQuestions: state.questions.length,
          question: state.questions[state.currentQuestion].question,
          options: state.questions[state.currentQuestion].options,
          category: state.questions[state.currentQuestion].category,
          timeLimit: state.timePerQuestion,
          activePlayer: state.activePlayer
        });
        
        // Start the timer for the first question
        startQuestionTimer(roomId);
      }
      break;
      
    case 'answer':
      // Only accept answer from the active player
      if (userId === state.activePlayer && state.started && !state.completed) {
        const answerIndex = payload.answerIndex;
        
        // Clear the question timer
        clearTimeout(state.timers.question);
        
        // Store the answer
        if (!state.answers[state.currentQuestion]) {
          state.answers[state.currentQuestion] = {};
        }
        
        state.answers[state.currentQuestion][userId] = answerIndex;
        
        // Check if answer is correct
        const correctAnswer = state.questions[state.currentQuestion].correctAnswer;
        const isCorrect = answerIndex === correctAnswer;
        
        // Award points if correct
        if (isCorrect) {
          state.scores[userId] = (state.scores[userId] || 0) + 1;
        }
        
        // Send result
        io.to(roomId).emit('trivia_c_answer_result', {
          questionNumber: state.currentQuestion + 1,
          userId,
          answerIndex,
          correctAnswer,
          isCorrect,
          scores: state.scores
        });
        
        // Move to next player or question
        handleNextPlayerOrQuestion(roomId);
      } else if (userId !== state.activePlayer) {
        // Not this player's turn
        socket.emit('error', { message: "It's not your turn to answer" });
      }
      break;
      
    case 'hint':
      // Allow the non-active player to provide a hint
      if (userId !== state.activePlayer && state.started && !state.completed) {
        // Send hint to the active player
        io.to(roomId).emit('trivia_c_hint', {
          fromUserId: userId,
          toUserId: state.activePlayer,
          hint: payload.hint
        });
      }
      break;
      
    case 'restart':
      // Only allow restart if game is completed
      if (state.completed) {
        // Reset the game
        state.questions = selectRandomQuestions(5);
        state.currentQuestion = 0;
        state.answers = {};
        state.scores = {};
        Object.keys(state.userReady).forEach(id => {
          state.scores[id] = 0;
          state.userReady[id] = true; // Keep players as ready
        });
        state.started = true;
        state.completed = false;
        
        // Randomize player order again
        state.playerOrder = Object.keys(state.userReady).sort(() => 0.5 - Math.random());
        state.activePlayer = state.playerOrder[0];
        
        // Send first question
        io.to(roomId).emit('trivia_c_question', {
          questionNumber: state.currentQuestion + 1,
          totalQuestions: state.questions.length,
          question: state.questions[state.currentQuestion].question,
          options: state.questions[state.currentQuestion].options,
          category: state.questions[state.currentQuestion].category,
          timeLimit: state.timePerQuestion,
          activePlayer: state.activePlayer
        });
        
        // Start the timer for the first question
        startQuestionTimer(roomId);
      }
      break;
      
    default:
      // For any other action, just broadcast to room
      socket.to(roomId).emit('trivia_c_action', {
        userId,
        action,
        payload
      });
  }
}

// Handle challenge completion
function onComplete(socket, data) {
  const { userId, roomId } = data;
  
  // Clean up room state
  if (roomStates[roomId]) {
    // Clear all timers
    Object.values(roomStates[roomId].timers).forEach(timer => {
      clearTimeout(timer);
    });
    
    delete roomStates[roomId];
  }
  
  // Broadcast completion to room
  io.to(roomId).emit('trivia_c_challenge_completed', {
    userId,
    message: "The technical knowledge challenge has been completed. You have mastered the technological secrets of this realm!"
  });
  
  return Promise.resolve(true);
}

module.exports = {
  initialize,
  onJoin,
  onAction,
  onComplete
};