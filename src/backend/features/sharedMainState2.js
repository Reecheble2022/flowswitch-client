import { createEntityAdapter } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

const activeCollectionAdapter = createEntityAdapter({ selectId: (data) => data.ky })

const mainSlice = createSlice({
    name: 'sharedstateslice',
    initialState: { active_collection: activeCollectionAdapter.getInitialState() },
    reducers: {
        setUsrCredentials: (state, { payload: { access_token, refresh_token, user_email, user_password } }) => {
            async function dispatchTokens() {
                try {
                    if (access_token) {
                        activeCollectionAdapter.upsertOne(state.active_collection, { ky: "access_token", va: access_token })
                        localStorage.setItem("access_token", access_token);
                    }
                    if (refresh_token) {
                        activeCollectionAdapter.upsertOne(state.active_collection, { ky: "refresh_token", va: refresh_token })
                        localStorage.setItem("refresh_token", refresh_token);
                    }
                    if (user_email) {
                        activeCollectionAdapter.upsertOne(state.active_collection, { ky: "user_email", va: user_email })
                        localStorage.setItem("user_email", user_email);
                    }
                    if (user_password) {
                        activeCollectionAdapter.upsertOne(state.active_collection, { ky: "user_password", va: user_password })
                        localStorage.setItem("user_password", user_password);
                    }
                } catch (error) {
                    console.error("Error saving user credentials =", JSON.stringify(error));
                }
            }
            dispatchTokens();
        },
    },
});

export const sharedStateReducer = mainSlice.reducer;
export const { setUsrCredentials } = mainSlice.actions;
