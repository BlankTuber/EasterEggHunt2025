/**
 * Trivia Group B Challenge Handler
 * 
 * Convergence challenge for Sage, Chronicler, and Apprentice
 * focusing on more niche/specialized knowledge.
 */

let io;

// Initialize the challenge handler
function initialize(socketIo) {
  io = socketIo;
}

// Challenge state for each room
const roomStates = {};

// Questions database for specialized knowledge trivia
const triviaQuestions = [
  {
    question: "What is the name of the geometric principle that states any point inside a triangle is at a weighted average distance from the three vertices?",
    options: ["Centroid Theorem", "Barycentric Coordinates", "Euler's Triangle Law", "Fermat's Point Principle"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "Which ancient civilization built the city of Teotihuacan?",
    options: ["Maya", "Aztec", "Olmec", "Unknown/Debated"],
    correctAnswer: 3,
    category: "History"
  },
  {
    question: "In literary theory, what term describes a narrative technique where the order of events is non-chronological?",
    options: ["Allegory", "Anachronism", "Analepsis", "Non-linear narrative"],
    correctAnswer: 3,
    category: "Literature"
  },
  {
    question: "What is the term for a protein that speeds up chemical reactions in living organisms?",
    options: ["Enzyme", "Hormone", "Antibody", "Receptor"],
    correctAnswer: 0,
    category: "Biology"
  },
  {
    question: "In color theory, what are the three secondary colors?",
    options: ["Red, Blue, Yellow", "Green, Orange, Purple", "Cyan, Magenta, Yellow", "Black, White, Gray"],
    correctAnswer: 1,
    category: "Art"
  },
  {
    question: "Which programming paradigm treats computation as the evaluation of mathematical functions?",
    options: ["Object-Oriented", "Procedural", "Functional", "Imperative"],
    correctAnswer: 2,
    category: "Computer Science"
  },
  {
    question: "What is the phenomenon where light bends when it passes from one medium to another?",
    options: ["Diffraction", "Refraction", "Reflection", "Dispersion"],
    correctAnswer: 1,
    category: "Physics"
  },
  {
    question: "Which constellation contains the star Betelgeuse?",
    options: ["Ursa Major", "Orion", "Cassiopeia", "Andromeda"],
    correctAnswer: 1,
    category: "Astronomy"
  },
  {
    question: "What philosophical concept refers to knowledge independent of experience?",
    options: ["A posteriori", "A priori", "Empiricism", "Materialism"],
    correctAnswer: 1,
    category: "Philosophy"
  },
  {
    question: "In music theory, what is a sequence of three or more notes played together called?",
    options: ["Chord", "Scale", "Arpeggio", "Melody"],
    correctAnswer: 0,
    category: "Music"
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
      timePerQuestion: 30, // seconds
      timers: {}
    };
    
    // Initialize scores for all users
    users.forEach(user => {
      roomStates[roomId].scores[user] = 0;
      roomStates[roomId].userReady[user] = false;
    });
  }
  
  // Send initial state to the user
  socket.emit('trivia_b_init', {
    userId,
    users,
    totalQuestions: roomStates[roomId].questions.length,
    message: "Welcome to the Advanced Trivia Challenge! This will test your specialized knowledge in various fields."
  });
  
  // Notify room that a new user has joined
  io.to(roomId).emit('trivia_b_user_joined', {
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
    // Time's up, check answers
    const currentAnswers = state.answers[state.currentQuestion] || {};
    
    // For users who didn't answer, set default
    Object.keys(state.userReady).forEach(id => {
      if (!currentAnswers[id]) {
        if (!state.answers[state.currentQuestion]) {
          state.answers[state.currentQuestion] = {};
        }
        state.answers[state.currentQuestion][id] = -1; // -1 indicates no answer
      }
    });
    
    // Calculate most common answer
    const answerCounts = {};
    Object.values(currentAnswers).forEach(answer => {
      if (answer >= 0) { // Only count actual answers
        answerCounts[answer] = (answerCounts[answer] || 0) + 1;
      }
    });
    
    let mostCommonAnswer = -1;
    let maxCount = 0;
    
    Object.entries(answerCounts).forEach(([answer, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonAnswer = parseInt(answer);
      }
    });
    
    // If no valid answers, set to invalid option
    if (mostCommonAnswer === -1) {
      mostCommonAnswer = -2; // Impossible answer
    }
    
    // Check if answer is correct
    const correctAnswer = state.questions[state.currentQuestion].correctAnswer;
    const isCorrect = mostCommonAnswer === correctAnswer;
    
    // Award points
    if (isCorrect) {
      Object.keys(currentAnswers).forEach(id => {
        if (currentAnswers[id] === correctAnswer) {
          state.scores[id] += 1;
        }
      });
    }
    
    // Send result
    io.to(roomId).emit('trivia_b_question_result', {
      questionNumber: state.currentQuestion + 1,
      correctAnswer,
      isCorrect,
      mostCommonAnswer,
      scores: state.scores,
      timeUp: true,
      userAnswers: currentAnswers
    });
    
    // Move to next question or end the game
    state.currentQuestion++;
    
    if (state.currentQuestion < state.questions.length) {
      // Send next question after a delay
      state.timers.next = setTimeout(() => {
        io.to(roomId).emit('trivia_b_question', {
          questionNumber: state.currentQuestion + 1,
          totalQuestions: state.questions.length,
          question: state.questions[state.currentQuestion].question,
          options: state.questions[state.currentQuestion].options,
          category: state.questions[state.currentQuestion].category,
          timeLimit: state.timePerQuestion
        });
        
        // Start the timer for the next question
        startQuestionTimer(roomId);
      }, 3000);
    } else {
      // End the game
      endGame(roomId);
    }
  }, state.timePerQuestion * 1000);
}

// End the trivia game
function endGame(roomId) {
  const state = roomStates[roomId];
  
  state.completed = true;
  
  // Calculate total score
  const totalScore = Object.values(state.scores).reduce((sum, score) => sum + score, 0);
  const maxPossibleScore = state.questions.length * Object.keys(state.scores).length;
  
  // Calculate success percentage
  const successPercentage = Math.round((totalScore / maxPossibleScore) * 100);
  
  // Determine if challenge is passed (>= 50% correct for advanced trivia)
  const passed = successPercentage >= 50;
  
  io.to(roomId).emit('trivia_b_complete', {
    scores: state.scores,
    totalScore,
    maxPossibleScore,
    successPercentage,
    passed,
    message: passed 
      ? "Impressive! Your specialized knowledge has unlocked ancient secrets."
      : "The ancient texts remain mysterious. Try again to unlock their secrets!"
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
      io.to(roomId).emit('trivia_b_user_ready', {
        userId,
        readyCount: Object.values(state.userReady).filter(ready => ready).length,
        totalUsers: Object.keys(state.userReady).length
      });
      
      if (allReady && !state.started) {
        // Start the trivia game
        state.started = true;
        
        // Send first question
        io.to(roomId).emit('trivia_b_question', {
          questionNumber: state.currentQuestion + 1,
          totalQuestions: state.questions.length,
          question: state.questions[state.currentQuestion].question,
          options: state.questions[state.currentQuestion].options,
          category: state.questions[state.currentQuestion].category,
          timeLimit: state.timePerQuestion
        });
        
        // Start the timer for the first question
        startQuestionTimer(roomId);
      }
      break;
      
    case 'answer':
      // Record player's answer if game is in progress
      if (state.started && !state.completed && state.currentQuestion < state.questions.length) {
        const answerIndex = payload.answerIndex;
        
        // Store the answer
        if (!state.answers[state.currentQuestion]) {
          state.answers[state.currentQuestion] = {};
        }
        
        state.answers[state.currentQuestion][userId] = answerIndex;
        
        // Notify room about player's answer
        io.to(roomId).emit('trivia_b_user_answered', {
          userId,
          questionNumber: state.currentQuestion + 1
        });
        
        // Check if all players have answered
        const allAnswered = Object.keys(state.userReady).every(id => 
          state.answers[state.currentQuestion] && state.answers[state.currentQuestion][id] !== undefined
        );
        
        if (allAnswered) {
          // Clear the question timer
          clearTimeout(state.timers.question);
          
          // Calculate most common answer
          const currentAnswers = state.answers[state.currentQuestion];
          const answerCounts = {};
          
          Object.values(currentAnswers).forEach(answer => {
            answerCounts[answer] = (answerCounts[answer] || 0) + 1;
          });
          
          let mostCommonAnswer = 0;
          let maxCount = 0;
          
          Object.entries(answerCounts).forEach(([answer, count]) => {
            if (count > maxCount) {
              maxCount = count;
              mostCommonAnswer = parseInt(answer);
            }
          });
          
          // Check if answer is correct
          const correctAnswer = state.questions[state.currentQuestion].correctAnswer;
          const isCorrect = mostCommonAnswer === correctAnswer;
          
          // Award points
          if (isCorrect) {
            Object.keys(currentAnswers).forEach(id => {
              if (currentAnswers[id] === correctAnswer) {
                state.scores[id] += 1;
              }
            });
          }
          
          // Send result
          io.to(roomId).emit('trivia_b_question_result', {
            questionNumber: state.currentQuestion + 1,
            correctAnswer,
            isCorrect,
            mostCommonAnswer,
            scores: state.scores,
            timeUp: false,
            userAnswers: currentAnswers
          });
          
          // Move to next question or end the game
          state.currentQuestion++;
          
          if (state.currentQuestion < state.questions.length) {
            // Send next question after a delay
            state.timers.next = setTimeout(() => {
              io.to(roomId).emit('trivia_b_question', {
                questionNumber: state.currentQuestion + 1,
                totalQuestions: state.questions.length,
                question: state.questions[state.currentQuestion].question,
                options: state.questions[state.currentQuestion].options,
                category: state.questions[state.currentQuestion].category,
                timeLimit: state.timePerQuestion
              });
              
              // Start the timer for the next question
              startQuestionTimer(roomId);
            }, 3000);
          } else {
            // End the game
            endGame(roomId);
          }
        }
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
        
        // Send first question
        io.to(roomId).emit('trivia_b_question', {
          questionNumber: state.currentQuestion + 1,
          totalQuestions: state.questions.length,
          question: state.questions[state.currentQuestion].question,
          options: state.questions[state.currentQuestion].options,
          category: state.questions[state.currentQuestion].category,
          timeLimit: state.timePerQuestion
        });
        
        // Start the timer for the first question
        startQuestionTimer(roomId);
      }
      break;
      
    default:
      // For any other action, just broadcast to room
      socket.to(roomId).emit('trivia_b_action', {
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
  io.to(roomId).emit('trivia_b_challenge_completed', {
    userId,
    message: "The advanced trivia challenge has been completed. Your specialized knowledge has unlocked ancient wisdom!"
  });
  
  return Promise.resolve(true);
}

module.exports = {
  initialize,
  onJoin,
  onAction,
  onComplete
};