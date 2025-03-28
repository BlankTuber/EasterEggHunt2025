/**
 * Trivia Group A Challenge Handler
 * 
 * Convergence challenge for Sage, Chronicler, and Apprentice
 * focusing on common knowledge questions.
 */

let io;

// Initialize the challenge handler
function initialize(socketIo) {
  io = socketIo;
}

// Challenge state for each room
const roomStates = {};

// Questions database for common knowledge trivia
const triviaQuestions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    category: "Astronomy"
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "Jane Austen", "William Shakespeare", "Mark Twain"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    question: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
    correctAnswer: 1,
    category: "Chemistry"
  },
  {
    question: "In what year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "Which of these is not a primary color in painting?",
    options: ["Red", "Blue", "Green", "Yellow"],
    correctAnswer: 2,
    category: "Art"
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Pablo Picasso", "Vincent van Gogh", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2,
    category: "Art"
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correctAnswer: 2,
    category: "Science"
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
      completed: false
    };
    
    // Initialize scores for all users
    users.forEach(user => {
      roomStates[roomId].scores[user] = 0;
      roomStates[roomId].userReady[user] = false;
    });
  }
  
  // Send initial state to the user
  socket.emit('trivia_a_init', {
    userId,
    users,
    totalQuestions: roomStates[roomId].questions.length,
    message: "Welcome to the Trivia Challenge! You must work together with the other champions to answer these questions."
  });
  
  // Notify room that a new user has joined
  io.to(roomId).emit('trivia_a_user_joined', {
    userId,
    totalUsers: users.length
  });
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
      io.to(roomId).emit('trivia_a_user_ready', {
        userId,
        readyCount: Object.values(state.userReady).filter(ready => ready).length,
        totalUsers: Object.keys(state.userReady).length
      });
      
      if (allReady && !state.started) {
        // Start the trivia game
        state.started = true;
        
        // Send first question
        io.to(roomId).emit('trivia_a_question', {
          questionNumber: state.currentQuestion + 1,
          totalQuestions: state.questions.length,
          question: state.questions[state.currentQuestion].question,
          options: state.questions[state.currentQuestion].options,
          category: state.questions[state.currentQuestion].category
        });
      }
      break;
      
    case 'answer':
      // Record player's answer
      if (state.currentQuestion < state.questions.length) {
        const answerIndex = payload.answerIndex;
        
        // Store the answer
        if (!state.answers[state.currentQuestion]) {
          state.answers[state.currentQuestion] = {};
        }
        
        state.answers[state.currentQuestion][userId] = answerIndex;
        
        // Notify room about player's answer
        io.to(roomId).emit('trivia_a_user_answered', {
          userId,
          questionNumber: state.currentQuestion + 1
        });
        
        // Check if all players have answered
        const currentAnswers = state.answers[state.currentQuestion];
        const allAnswered = Object.keys(state.userReady)
          .every(id => currentAnswers[id] !== undefined);
        
        if (allAnswered) {
          // Calculate most common answer
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
          io.to(roomId).emit('trivia_a_question_result', {
            questionNumber: state.currentQuestion + 1,
            correctAnswer,
            isCorrect,
            mostCommonAnswer,
            scores: state.scores
          });
          
          // Move to next question or end the game
          state.currentQuestion++;
          
          if (state.currentQuestion < state.questions.length) {
            // Send next question after a delay
            setTimeout(() => {
              io.to(roomId).emit('trivia_a_question', {
                questionNumber: state.currentQuestion + 1,
                totalQuestions: state.questions.length,
                question: state.questions[state.currentQuestion].question,
                options: state.questions[state.currentQuestion].options,
                category: state.questions[state.currentQuestion].category
              });
            }, 3000);
          } else {
            // End the game
            state.completed = true;
            
            // Calculate total score
            const totalScore = Object.values(state.scores).reduce((sum, score) => sum + score, 0);
            const maxPossibleScore = state.questions.length * Object.keys(state.scores).length;
            
            // Calculate success percentage
            const successPercentage = Math.round((totalScore / maxPossibleScore) * 100);
            
            // Determine if challenge is passed (>= 60% correct)
            const passed = successPercentage >= 60;
            
            io.to(roomId).emit('trivia_a_complete', {
              scores: state.scores,
              totalScore,
              maxPossibleScore,
              successPercentage,
              passed,
              message: passed 
                ? "Congratulations! Your combined knowledge has unlocked the next step of your journey."
                : "You need to improve your collective knowledge. Try again!"
            });
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
        io.to(roomId).emit('trivia_a_question', {
          questionNumber: state.currentQuestion + 1,
          totalQuestions: state.questions.length,
          question: state.questions[state.currentQuestion].question,
          options: state.questions[state.currentQuestion].options,
          category: state.questions[state.currentQuestion].category
        });
      }
      break;
      
    default:
      // For any other action, just broadcast to room
      socket.to(roomId).emit('trivia_a_action', {
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
  delete roomStates[roomId];
  
  // Broadcast completion to room
  io.to(roomId).emit('trivia_a_challenge_completed', {
    userId,
    message: "The trivia challenge has been completed. Your shared knowledge has unlocked the next step of your journey!"
  });
  
  return Promise.resolve(true);
}

module.exports = {
  initialize,
  onJoin,
  onAction,
  onComplete
};