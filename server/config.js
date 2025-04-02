module.exports = {
    port: process.env.PORT || 3001,
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    maxPlayersPerRoom: {
        trivia: 3,
        puzzle: 5,
    },
};
