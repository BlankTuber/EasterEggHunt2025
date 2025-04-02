class RoomManager {
    constructor() {
        this.rooms = new Map(); // Maps roomId to room instance
    }

    createRoom(gameType, GameClass) {
        const roomId = this.generateRoomId();
        const room = new GameClass(roomId);
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    destroyRoom(roomId) {
        this.rooms.delete(roomId);
    }

    generateRoomId() {
        // Generate a 6-character alphanumeric room code
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let result = "";
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

module.exports = RoomManager;
