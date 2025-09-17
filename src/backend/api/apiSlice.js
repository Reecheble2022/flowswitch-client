// eslint-disable-next-line no-unused-vars
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createEntityAdapter } from "@reduxjs/toolkit";
// import { getWebSocketInstance } from './websocketConnection';
import { setUsrCredentials } from "../features/sharedMainState2"
const API_BASE_URL = "https://flowswitch-backend-566729010148.africa-south1.run.app";
// const API_BASE_URL = "http://localhost:8080";

const activeCollectionAdapter = createEntityAdapter({ selectId: (data) => data.ky });

const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
    //credentials: "omit",
    prepareHeaders: (headers, { getState, endpoint }) => {
        // if user is authenticated, add auth token to request header
        const { va: accessToken } = getState().sharedstateslice?.active_collection?.entities?.access_token || {};
        if (typeof accessToken === "string") {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }
        if (endpoint !== "fileUploader") {
            headers.set("Content-Type", "application/json");
        }
        return headers;
    },
});

// if token expires automatically refresh token
const refreshQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include", // For web
    //credentials: "omit", // For mobile
    prepareHeaders: (headers, { getState, endpoint }) => {
        // if user is authenticated, add auth token to request header
        const { va: refreshToken } = getState().sharedstateslice?.active_collection?.entities?.refresh_token || {};
        if (typeof refreshToken === "string") {
            headers.set("Authorization", `Bearer ${refreshToken}`);
        }
        if (endpoint !== "fileUploader") {
            headers.set("Content-Type", "application/json");
        }
        return headers;
    },
});

// const websocketBaseQuery = (url) => {
//     return new Promise((resolve, reject) => {
//         const ws = getWebSocketInstance(url);
//         ws.onopen = () => {
//             resolve({ data: "WebSocket connection established." });
//         };
//         ws.onmessage = (event) => {
//             resolve({ data: JSON.parse(event.data) });
//         };
//         ws.onerror = (error) => {
//             reject({ error });
//         };
//         // Return sendMessage function
//         return (message) => {
//             if (ws.readyState === WebSocket.OPEN) {
//                 ws.send(JSON.stringify(message));
//             } else {
//                 console.error("WebSocket is not open. Cannot send message.");
//             }
//         };
//     });
// };

const baseQueryWithReauth = async (args, api, extraOptions) => {

    // if (typeof args === 'string' && (args?.startsWith("ws://") || args?.startsWith("wss://"))) {
    //     // If the request is a WebSocket connection
    //     return await websocketBaseQuery(args);
    // }
    let result = await baseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401) {
        const { getState } = api || {}
        const { va: user } = getState()?.sharedstateslice?.active_collection?.entities?.user || {};
        // try and refresh token
        const refreshResult = await refreshQuery(
            {
                url: `/reech-main-api/auth/get-new-access-token`,
                method: "POST",
                body: { userId: user._id },
            },
            api,
            extraOptions
        );
        try {
            if (refreshResult.error) {
                activeCollectionAdapter.removeOne(api.getState()?.sharedstateslice?.active_collection, "access_token")
                activeCollectionAdapter.removeOne(api.getState()?.sharedstateslice?.active_collection, "refresh_token")
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                await activeCollectionAdapter.removeOne(api.getState()?.sharedstateslice?.active_collection, "user")
                localStorage.removeItem("REECH_CURRENT_USER");
            } else if (refreshResult?.data?.token || refreshResult?.data?.Data) {
                const { access_token } = refreshResult.data.token || refreshResult?.data?.Data || {};
                if (access_token) {
                    api.dispatch(setUsrCredentials({ access_token }))
                }
            }
            // retry the initial query
            result = await baseQuery(args, api, extraOptions);
        } catch (err) {
            result = new Error(`|eeeee||||Error in baseQueryWithReauth- while retrying initial query after refresh`)
        }
    }
    return result;
};
export const appiiSlice = createApi({
    reducerPath: "appii",
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        "active_collection",
        "message",
        "user",
    ],
    endpoints: (builder) => ({}),
});

