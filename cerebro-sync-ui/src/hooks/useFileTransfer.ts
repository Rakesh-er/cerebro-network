/**
 * useFileTransfer — Handles chunked video/audio file transfer over Socket.IO.
 *
 * BROADCASTER: Call `sendFile(file, roomCode)` after creating a room.
 *   - Reads the file in 512KB chunks
 *   - Sends FILE_START → FILE_CHUNK × N → FILE_END to server
 *   - Server relays each event to all listeners in the room
 *
 * LISTENER: The hook listens for FILE_START / FILE_CHUNK / FILE_END.
 *   - Assembles chunks into a Blob
 *   - Sets `receivedObjectURL` to a playable object URL
 *   - Exposes `transferProgress` (0-100) and `isTransferComplete`
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '@/lib/socket';

const CHUNK_SIZE = 512 * 1024; // 512 KB per chunk

interface FileTransferState {
    /** 0–100 upload/download progress */
    transferProgress: number;
    /** True once all chunks received and Blob URL is ready */
    isTransferComplete: boolean;
    /** Object URL of the fully received file — assign to <video src> */
    receivedObjectURL: string | null;
    /** File name received */
    receivedFileName: string | null;
}

export function useFileTransfer(isBroadcaster: boolean) {
    const [state, setState] = useState<FileTransferState>({
        transferProgress: 0,
        isTransferComplete: false,
        receivedObjectURL: null,
        receivedFileName: null,
    });

    const chunksRef   = useRef<ArrayBuffer[]>([]);
    const totalRef    = useRef<number>(0);
    const fileTypeRef = useRef<string>('video/mp4');

    // ── LISTENER: receive chunks ─────────────────────────────────────
    useEffect(() => {
        if (isBroadcaster) return;

        const onStart = (data: { fileName: string; fileType: string; fileSize: number; totalChunks: number }) => {
            console.log(`[FILE RX] Start — ${data.fileName} (${(data.fileSize / 1024 / 1024).toFixed(1)} MB, ${data.totalChunks} chunks)`);
            chunksRef.current = new Array(data.totalChunks);
            totalRef.current  = data.totalChunks;
            fileTypeRef.current = data.fileType;
            setState({
                transferProgress: 0,
                isTransferComplete: false,
                receivedObjectURL: null,
                receivedFileName: data.fileName,
            });
        };

        const onChunk = (data: { chunkIndex: number; totalChunks: number; chunk: ArrayBuffer }) => {
            chunksRef.current[data.chunkIndex] = data.chunk;
            const received = chunksRef.current.filter(Boolean).length;
            const progress = Math.round((received / data.totalChunks) * 100);
            setState(prev => ({ ...prev, transferProgress: progress }));
        };

        const onEnd = (data: { fileName: string; fileType: string }) => {
            console.log(`[FILE RX] Complete — assembling ${chunksRef.current.length} chunks`);
            const blob = new Blob(chunksRef.current, { type: data.fileType || fileTypeRef.current });
            const url  = URL.createObjectURL(blob);
            setState(prev => ({
                ...prev,
                transferProgress: 100,
                isTransferComplete: true,
                receivedObjectURL: url,
            }));
        };

        socket.on('FILE_START', onStart);
        socket.on('FILE_CHUNK', onChunk);
        socket.on('FILE_END',   onEnd);

        // Ask the server to replay any buffered file for this room.
        // This is emitted AFTER the listeners above are registered,
        // so we're guaranteed to receive the replayed chunks.
        console.log('[FILE RX] Requesting file from server...');
        socket.emit('REQUEST_FILE');

        return () => {
            socket.off('FILE_START', onStart);
            socket.off('FILE_CHUNK', onChunk);
            socket.off('FILE_END',   onEnd);
            // Revoke any previous URL on cleanup
            setState(prev => {
                if (prev.receivedObjectURL) URL.revokeObjectURL(prev.receivedObjectURL);
                return { transferProgress: 0, isTransferComplete: false, receivedObjectURL: null, receivedFileName: null };
            });
        };
    }, [isBroadcaster]);

    // ── BROADCASTER: send file in chunks ─────────────────────────────
    const sendFile = useCallback(async (file: File, roomCode: string) => {
        if (!isBroadcaster) return;

        const arrayBuffer  = await file.arrayBuffer();
        const totalChunks  = Math.ceil(arrayBuffer.byteLength / CHUNK_SIZE);

        console.log(`[FILE TX] Sending ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB, ${totalChunks} chunks)`);

        // Announce
        socket.emit('FILE_START', {
            roomCode,
            fileName: file.name,
            fileType: file.type || 'video/mp4',
            fileSize: file.size,
            totalChunks,
        });

        setState(prev => ({ ...prev, transferProgress: 0 }));

        // Send chunks with a tiny yield between each so the UI doesn't freeze
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end   = Math.min(start + CHUNK_SIZE, arrayBuffer.byteLength);
            const chunk = arrayBuffer.slice(start, end);

            socket.emit('FILE_CHUNK', {
                roomCode,
                chunkIndex: i,
                totalChunks,
                chunk,
            });

            const progress = Math.round(((i + 1) / totalChunks) * 100);
            setState(prev => ({ ...prev, transferProgress: progress }));

            // Yield every 10 chunks to avoid blocking the event loop
            if (i % 10 === 9) await new Promise(r => setTimeout(r, 0));
        }

        // Done
        socket.emit('FILE_END', { roomCode, fileName: file.name, fileType: file.type });
        setState(prev => ({ ...prev, transferProgress: 100, isTransferComplete: true }));
        console.log(`[FILE TX] Done — ${file.name}`);

    }, [isBroadcaster]);

    return {
        ...state,
        sendFile,
    };
}
