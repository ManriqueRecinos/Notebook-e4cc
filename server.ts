/**
 * Custom server with Next.js + Socket.io
 * Run: npx ts-node --project tsconfig.server.json server.ts
 * Or: node server.js (after compilation)
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketServer } from 'socket.io';
import { neon } from '@neondatabase/serverless';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = parseInt(process.env.PORT || '3000');

// Database connection for socket events
const DATABASE_URL = process.env.DATABASE_URL || '';
const sql = neon(DATABASE_URL);

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    // Socket.io server
    const io = new SocketServer(server, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
    });

    // Track active users per notebook
    const activeUsers = new Map<string, Set<{ userId: string; name: string; socketId: string }>>();

    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        // ---- join_notebook ----
        socket.on('join_notebook', ({ notebookId, userId, userName }) => {
            socket.join(`notebook:${notebookId}`);

            if (!activeUsers.has(notebookId)) {
                activeUsers.set(notebookId, new Set());
            }
            activeUsers.get(notebookId)!.add({ userId, name: userName, socketId: socket.id });

            // Broadcast presence
            io.to(`notebook:${notebookId}`).emit('presence_update', {
                notebookId,
                users: Array.from(activeUsers.get(notebookId)!).map(u => ({
                    userId: u.userId,
                    name: u.name,
                })),
            });

            console.log(`[Socket] ${userName} joined notebook ${notebookId}`);
        });

        // ---- leave_notebook ----
        socket.on('leave_notebook', ({ notebookId }) => {
            socket.leave(`notebook:${notebookId}`);
            removeUserFromNotebook(notebookId, socket.id);
        });

        // ---- content_updated ----
        socket.on('content_updated', async ({ notebookId, blockId, content, userId, userName }) => {
            // Broadcast to all other clients in the room
            socket.to(`notebook:${notebookId}`).emit('content_updated', {
                blockId,
                content,
                userId,
                userName,
                timestamp: new Date().toISOString(),
            });

            // Persist the change to activity_logs
            try {
                // Get workspace_id from notebook
                const nb = await sql`SELECT workspace_id FROM notebooks WHERE id = ${notebookId}`;
                if (nb.length > 0) {
                    await sql`
            INSERT INTO activity_logs (workspace_id, notebook_id, user_id, entity_type, entity_id, action, new_data)
            VALUES (${nb[0].workspace_id}, ${notebookId}, ${userId}, 'block', ${blockId}, 'UPDATE', ${JSON.stringify({ content })})
          `;
                }
            } catch (err) {
                console.error('[Socket] Failed to log activity:', err);
            }

            console.log(`[Socket] Content updated in notebook ${notebookId} by ${userName}`);
        });

        // ---- disconnect ----
        socket.on('disconnect', () => {
            // Remove user from all notebooks
            for (const [notebookId] of activeUsers) {
                removeUserFromNotebook(notebookId, socket.id);
            }
            console.log(`[Socket] Disconnected: ${socket.id}`);
        });
    });

    function removeUserFromNotebook(notebookId: string, socketId: string) {
        const users = activeUsers.get(notebookId);
        if (users) {
            for (const user of users) {
                if (user.socketId === socketId) {
                    users.delete(user);
                    break;
                }
            }
            // Broadcast updated presence
            io.to(`notebook:${notebookId}`).emit('presence_update', {
                notebookId,
                users: Array.from(users).map(u => ({ userId: u.userId, name: u.name })),
            });
            if (users.size === 0) activeUsers.delete(notebookId);
        }
    }

    server.listen(PORT, () => {
        console.log(`> Lexora server running on http://localhost:${PORT}`);
        console.log(`> WebSocket server active`);
    });
});
