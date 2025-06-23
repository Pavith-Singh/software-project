"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./database"));
const app = (0, express_1.default)();
const port = 9000;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: 'http://software-project-pearl.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log(`Server running on http://localhost:${port}`);
const sendFriendRequest = (req, res, next) => {
    const { requester_uid, requested_uid } = req.body;
    if (!requester_uid || !requested_uid) {
        res.status(400).json({ message: 'Missing UIDs' });
        return;
    }
    try {
        const stmt = database_1.default.prepare(`INSERT INTO friend_requests (requester_uid, requested_uid) VALUES (?, ?)`);
        stmt.run(requester_uid, requested_uid);
        console.log(`[FRIEND REQUEST] ${requester_uid} → ${requested_uid}`);
        res.json({ success: true });
    }
    catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            res.status(409).json({ message: 'Duplicate request or bad data' });
            return;
        }
        console.error('Error sending friend request:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const getFriendRequests = (req, res, next) => {
    const { uid } = req.params;
    try {
        const received = database_1.default.prepare(`SELECT * FROM friend_requests WHERE requested_uid = ?`).all(uid);
        const sent = database_1.default.prepare(`SELECT * FROM friend_requests WHERE requester_uid = ?`).all(uid);
        res.json({ sent, received });
    }
    catch (err) {
        console.error('Error fetching requests:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const updateFriendRequest = (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
        res.status(400).json({ message: 'Status must be accepted or rejected' });
        return;
    }
    try {
        const stmt = database_1.default.prepare(`UPDATE friend_requests SET status = ? WHERE id = ?`);
        const info = stmt.run(status, id);
        if (info.changes === 0) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }
        console.log(`[FRIEND REQUEST] id ${id} set to ${status}`);
        res.json({ success: true });
    }
    catch (err) {
        console.error('Error updating friend request:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const getFriends = (req, res) => {
    const { uid } = req.params;
    try {
        const rows = database_1.default.prepare(`
            SELECT requester_uid, requested_uid
            FROM friend_requests
            WHERE (requester_uid = ? OR requested_uid = ?)
            AND status = 'accepted'
        `).all(uid, uid);
        const friends = rows.map((r) => r.requester_uid === uid ? r.requested_uid : r.requester_uid);
        res.json({ friends });
    }
    catch (err) {
        console.error('Error fetching friends:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
app.post('/friend-request', sendFriendRequest);
app.get('/friend-requests/:uid', getFriendRequests);
app.put('/friend-request/:id', updateFriendRequest);
app.get('/friends/:uid', getFriends);
app.delete('/friend/:uid1/:uid2', (req, res) => {
    const { uid1, uid2 } = req.params;
    try {
        const stmt = database_1.default.prepare(`
            DELETE FROM friend_requests
            WHERE status = 'accepted'
            AND (
                (requester_uid = ? AND requested_uid = ?)
            OR (requester_uid = ? AND requested_uid = ?)
            )
        `);
        stmt.run(uid1, uid2, uid2, uid1);
        res.json({ success: true });
    }
    catch (err) {
        console.error('Error deleting friendship:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.listen(port, () => {
    console.log(`now listening on port ${port}`);
});
