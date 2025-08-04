//const io = require('socket.io-client/dist/socket.io');
import { io } from "socket.io-client";
let socketInstance = null;
let reconnectInterval = 1000; // Initial reconnect interval in milliseconds
const maxReconnectInterval = 30000; // Maximum interval for reconnection attempts


const createSocket = (url) => {
    if (socketInstance) {
        return socketInstance;
    }

    socketInstance = io(url, {
        transports: ['websocket'], // Use the WebSocket transport
        reconnection: true, // Enable automatic reconnection
        reconnectionAttempts: Infinity, // Unlimited reconnection attempts
        reconnectionDelay: reconnectInterval, // Reconnection delay interval
        reconnectionDelayMax: maxReconnectInterval, // Maximum reconnection delay
        extraHeaders: {
            'Authorization': 'Bearer yourAuthToken',
        }
    });

    // Connection established
    socketInstance.on('connect', () => {
        try {
            const profileIDs = ["ofjvvbvbefoiorurbvbvb", "iuruirurhbo"];
            if (Array.isArray(profileIDs) && profileIDs.length > 0) {
                socketInstance.emit('subscribe', {
                    type: "subscribe",
                    topic: ["message", "notification", "backendEvent"],
                    channel: profileIDs,
                });
            }
        } catch (err) {
            console.warn(`Error while sending subscription message: ${err}`);
        }
    });

    // Listen for messages
    socketInstance.on('message', (data) => {
        // Handle incoming messages if needed
    });

    // Handle errors
    socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
    });

    // Handle disconnection
    socketInstance.on('disconnect', (reason) => {
        console.warn(`Socket disconnected: ${reason}`);
        socketInstance = null;
    });

    return socketInstance;
};

// Create and return the socket instance
export const getWebSocketInstance = (url) => {
    return createSocket(url);
};