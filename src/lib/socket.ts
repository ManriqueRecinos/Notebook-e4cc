'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
    notebookId: string;
    userId: string;
    userName: string;
    onContentUpdated?: (data: {
        blockId: string;
        content: Record<string, unknown>;
        userId: string;
        userName: string;
        timestamp: string;
    }) => void;
    onPresenceUpdate?: (data: {
        notebookId: string;
        users: { userId: string; name: string }[];
    }) => void;
}

export function useSocket({
    notebookId,
    userId,
    userName,
    onContentUpdated,
    onPresenceUpdate,
}: UseSocketOptions) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(window.location.origin, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_notebook', { notebookId, userId, userName });
        });

        socket.on('content_updated', (data) => {
            onContentUpdated?.(data);
        });

        socket.on('presence_update', (data) => {
            onPresenceUpdate?.(data);
        });

        return () => {
            socket.emit('leave_notebook', { notebookId });
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notebookId, userId, userName]);

    const emitContentUpdate = useCallback((blockId: string, content: Record<string, unknown>) => {
        socketRef.current?.emit('content_updated', {
            notebookId,
            blockId,
            content,
            userId,
            userName,
        });
    }, [notebookId, userId, userName]);

    return { emitContentUpdate, socket: socketRef };
}
