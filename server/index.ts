import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import db from './database';

const app: Express = express();
const port = 9000;

app.use(express.json());
app.use(cors({
    origin: 'https://software-project-pearl.vercel.app',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

console.log(`Server running on http://localhost:${port}`);

const sendFriendRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { requester_uid, requested_uid } = req.body;
    if (!requester_uid || !requested_uid) {
        res.status(400).json({ message: 'Missing UIDs' });
        return;
    }
    try {
        const stmt = db.prepare(
            `INSERT INTO friend_requests (requester_uid, requested_uid) VALUES (?, ?)`
        );
        stmt.run(requester_uid, requested_uid);
        console.log(`[FRIEND REQUEST] ${requester_uid} → ${requested_uid}`);
        res.json({ success: true });
    } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            res.status(409).json({ message: 'Duplicate request or bad data' });
            return;
        }
        console.error('Error sending friend request:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getFriendRequests = (req: Request, res: Response, next: NextFunction): void => {
    const { uid } = req.params as { uid: string };
    try {
        const received = db.prepare(
            `SELECT * FROM friend_requests WHERE requested_uid = ?`
        ).all(uid);
        const sent = db.prepare(
            `SELECT * FROM friend_requests WHERE requester_uid = ?`
        ).all(uid);
        res.json({ sent, received });
    } catch (err: any) {
        console.error('Error fetching requests:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const updateFriendRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
        res.status(400).json({ message: 'Status must be accepted or rejected' });
        return;
    }
    try {
        const stmt = db.prepare(
            `UPDATE friend_requests SET status = ? WHERE id = ?`
        );
        const info = stmt.run(status, id);
        if (info.changes === 0) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }
        console.log(`[FRIEND REQUEST] id ${id} set to ${status}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating friend request:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const getFriends = (req: Request, res: Response): void => {
    const { uid } = req.params as { uid: string };
    try {
        interface Row { requester_uid: string; requested_uid: string }
        const rows = db.prepare(`
            SELECT requester_uid, requested_uid
            FROM friend_requests
            WHERE (requester_uid = ? OR requested_uid = ?)
            AND status = 'accepted'
        `).all(uid, uid) as Row[];

        const friends = rows.map((r: Row) =>
            r.requester_uid === uid ? r.requested_uid : r.requester_uid
        );

        res.json({ friends });
    } catch (err: any) {
        console.error('Error fetching friends:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

app.post('/friend-request', sendFriendRequest);

app.get('/friend-requests/:uid', getFriendRequests);


app.put('/friend-request/:id', updateFriendRequest);

app.get('/friends/:uid', getFriends);

app.delete('/friend/:uid1/:uid2', (req: Request, res: Response): void => {
    const { uid1, uid2 } = req.params as { uid1: string; uid2: string };
    try {
        const stmt = db.prepare(`
            DELETE FROM friend_requests
            WHERE status = 'accepted'
            AND (
                (requester_uid = ? AND requested_uid = ?)
            OR (requester_uid = ? AND requested_uid = ?)
            )
        `);
        stmt.run(uid1, uid2, uid2, uid1);
        res.json({ success: true });
    } catch (err: any) {
        console.error('Error deleting friendship:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`now listening on port ${port}`);
});