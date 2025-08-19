// eslint-disable-next-line no-unused-vars
import { useSelector } from "react-redux"
import {
    // createAsyncThunk, 
    createEntityAdapter, createSelector, createSlice, current
} from "@reduxjs/toolkit";
import { sharedCrudApi } from "../api/sharedCrud";

const activeCollectionAdapter = createEntityAdapter({ selectId: (data) => data.ky })
const merchantAdaptor = createEntityAdapter({ selectId: (data) => data.guid || data._id })
const agentAdaptor = createEntityAdapter({ selectId: (data) => data._id })
const notificationAdaptor = createEntityAdapter({ selectId: (data) => data.guid || data._id })
const messageAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })
const activeChatMessageAdaptor = createEntityAdapter({ selectId: (data) => data.id })
const chatGroupAdaptor = createEntityAdapter({ selectId: (data) => data._id })
const fileuploadAdaptor = createEntityAdapter({ selectId: (data) => data._id })
const errorAdaptor = createEntityAdapter({ selectId: (data) => data.guid })
const cashnoteverificationAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })
const agentverificationAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })
const voucherAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })
const floatwalletAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })
const agentmerchanttrustAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })
const roleAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })
const permissionAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })
const userAdaptor = createEntityAdapter({ selectId: (data) => (data.guid || data._id) })

export const mainAdaptors = {
    active_collection: activeCollectionAdapter,
    agent: agentAdaptor,
    merchant: merchantAdaptor,
    notification: notificationAdaptor,
    message: messageAdaptor,
    activechatmessage: activeChatMessageAdaptor,
    chatgroup: chatGroupAdaptor,
    fileupload: fileuploadAdaptor,
    cashnoteverification: cashnoteverificationAdaptor,
    agentverification: agentverificationAdaptor,
    voucher: voucherAdaptor, 
    floatwallet: floatwalletAdaptor,
    agentmerchanttrust: agentmerchanttrustAdaptor,
    role: roleAdaptor,
    permission: permissionAdaptor,
    user: userAdaptor,
    error: errorAdaptor,
}

export const mainInixoStates = {
    active_collection: activeCollectionAdapter.getInitialState(),
    agent: agentAdaptor.getInitialState(),
    merchant: merchantAdaptor.getInitialState(),
    message: messageAdaptor.getInitialState(),
    activechatmessage: activeChatMessageAdaptor.getInitialState(),
    notification: notificationAdaptor.getInitialState(),
    chatgroup: chatGroupAdaptor.getInitialState(),
    fileupload: fileuploadAdaptor.getInitialState(),
    cashnoteverification: cashnoteverificationAdaptor.getInitialState(),
    agentverification: agentverificationAdaptor.getInitialState(),
    voucher: voucherAdaptor.getInitialState(), 
    floatwallet: floatwalletAdaptor.getInitialState(),
    agentmerchanttrust: agentmerchanttrustAdaptor.getInitialState(),
    role: roleAdaptor.getInitialState(),
    permission: permissionAdaptor.getInitialState(),
    user: userAdaptor.getInitialState(),
    error: null,
}

let backendEventCallbacksMap = {};

const mainSlice = createSlice({
    name: 'sharedstateslice',
    initialState: mainInixoStates,
    reducers: {
        rememberToken: (state, { payload: { ky, va } }) => {
            mainAdaptors["active_collection"].upsertOne(state["active_collection"], { ky, va })
        },
        removeToken: (state, { payload: { ky } }) => {
            mainAdaptors["active_collection"].removeOne(state["active_collection"], ky)
        },
        streamDataReceivedCallback: (state, { payload: { topic, entity, Data, componentId, ev, cb, unmount } }) => {
            try {
                if (topic === "backendEvent") {
                    const { backendEventType } = Data || {}
                    const subscribers = backendEventCallbacksMap[backendEventType] || {};
                    Object.keys(subscribers).forEach(compntId => {
                        const subscriberCallback = subscribers[compntId];
                        subscriberCallback(Data);
                    })
                } else if ((typeof topic === "string") && (topic !== "") && state[entity]) {
                    const entity = topic;
                    mainAdaptors[entity].upsertOne(state[entity], Data)
                    if (topic === "message") {
                        //TODO: notify the chatting screen and the chatsList screen to re-render, if they are currently mounted
                    }
                } else if ((typeof ev === "string") && (typeof cb === "function") && (typeof componentId === "string")) {
                    if (!backendEventCallbacksMap[ev]) {
                        backendEventCallbacksMap[ev] = {}
                    }
                    backendEventCallbacksMap[ev][componentId] = cb;
                } else if ((typeof ev === "string") && (typeof componentId === "string") && unmount) {
                    if (backendEventCallbacksMap[ev] && backendEventCallbacksMap[ev][componentId]) {
                        delete backendEventCallbacksMap[ev][componentId];
                    }
                }
            } catch (er) {
                console.error("!!streamDataReceivedCallback unexpected error = ", current(er));
            }
        },

        setActiveChatMessages: (state, { payload: { message, messages, overwrite = true } }) => {
            try {
                if (message) {
                    mainAdaptors["activechatmessage"].upsertOne(state["activechatmessage"], message)
                } else if (Array.isArray(messages)) {
                    if (overwrite) {
                        mainAdaptors["activechatmessage"].setAll(state["activechatmessage"], messages)
                    } else {
                        mainAdaptors["activechatmessage"].upsertMany(state["activechatmessage"], messages)
                    }
                }
            } catch (err) {
                console.error("Error setting user active profile =", current(err));
            }
        },

        setActiveChatPivot: (state, { payload: { activeProfileId, channelId, merchantId, ...otherFields } }) => {
            try {
                if (activeProfileId && channelId && merchantId) {
                    mainAdaptors["active_collection"].upsertOne(state["active_collection"], { ky: "activechatpivot", va: { activeProfileId, channelId, merchantId, ...otherFields } })
                }
            } catch (error) {
                console.error("Error setting user active profile =", current(error));
            }
        },

        saveDownloadedImageData: (state, { payload: { entity, guid, datakey, data: imageData, guidInArr } }) => {
            if (entity === "active_collection") {
                let targetData = state.active_collection?.entities[guid]?.va;
                if (Array.isArray(targetData)) {
                    targetData.forEach((recd, i) => {
                        if (recd._id === guidInArr) {
                            targetData[i] = { ...recd, [datakey]: imageData };
                            mainAdaptors["active_collection"].upsertOne(state["active_collection"], { ky: guid, va: targetData })
                        }
                    })
                } else if (Object.keys(targetData || {}).length > 0) {
                    const updatedData = { ...targetData, [datakey]: imageData };
                    mainAdaptors["active_collection"].upsertOne(state["active_collection"], { ky: guid, va: updatedData })
                }
            } else {
                if (mainAdaptors[entity]) {
                    if (state[entity]) {
                        mainAdaptors[entity].updateOne(state[entity], { _id: guid, [datakey]: imageData })
                    } else {
                        console.warn(`Failed to save downloaded Image data because -> state[${entity}] not found`)
                    }
                } else {
                    console.warn(`Failed to save downloaded Image data because -> mainAdaptors[${entity}] not found`)
                }
            }
        },
        setError(state, { payload: err }) {
            mainAdaptors["error"].upsertOne(state["error"], { guid: "REDUXERR", ...err })
        },
        clearError(state) {
            mainAdaptors["error"].removeOne(state["error"], { guid: "REDUXERR" })
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(
                sharedCrudApi.endpoints.userLogin.matchFulfilled,
                (state, { payload: { access_token, refresh_token, user, profiles } }) => {
                    try {
                        if ((!!access_token) && (!!refresh_token)) {
                            let activeObjects = [{ ky: "access_token", va: access_token }, { ky: "refresh_token", va: refresh_token }, { ky: "user", va: user }]
                            if (Array.isArray(profiles) && profiles.length > 0) {
                                const activeProfile = profiles?.find(pro => pro.profileType === "poster");
                                activeObjects.push({ ky: "profile", va: activeProfile })
                            }
                            mainAdaptors["active_collection"].upsertMany(state["active_collection"], activeObjects)
                            localStorage.setItem("access_token", access_token);
                        }
                    } catch (err) {
                        state.error = err || { message: "Unexpected error", code: "REDUX-addMatcher-userLogin" };
                    }
                })
            .addMatcher(
                sharedCrudApi.endpoints.otpVerifier.matchFulfilled,
                (state, { payload: { access_token, refresh_token, user, profiles } }) => {
                    try {
                        if ((!!access_token) && (!!refresh_token)) {
                            let activeObjects = [{ ky: "access_token", va: access_token }, { ky: "refresh_token", va: refresh_token }, { ky: "user", va: user }]
                            if (Array.isArray(profiles) && profiles.length > 0) {
                                const activeProfile = profiles?.find(pro => pro.profileType === "poster");
                                activeObjects.push({ ky: "profile", va: activeProfile })
                            }
                            mainAdaptors["active_collection"].upsertMany(state["active_collection"], activeObjects)
                            localStorage.setItem("access_token", access_token);
                        }
                    } catch (err) {
                        state.error = err || { message: "Unexpected error", code: "REDUX-addMatcher-otpVerifier" };
                    }
                })
            .addMatcher(
                sharedCrudApi.endpoints.itemRegistrer.matchFulfilled,
                (state, { payload: { entity, Data } }) => {
                    mainAdaptors[entity].upsertOne(state[entity], Data);
                })
            .addMatcher(
                sharedCrudApi.endpoints.fileUploader.matchFulfilled,
                (state, { payload: { entity, Data } }) => {
                    mainAdaptors[entity].upsertOne(state[entity], Data);
                })
            .addMatcher(
                sharedCrudApi.endpoints.itemsListReader.matchFulfilled,
                (state, { payload: { entity, Data } }) => {
                    try {
                        if (entity) {
                            mainAdaptors[entity].setAll(state[entity], Data);
                        }
                        if (entity === "message") {
                            const activeChatPivot = useSelector(st => selectOneItemByGuid(st, "active_collection", "activechatpivot"))
                            const { activeProfileId, merchantId, channelId } = activeChatPivot || {}
                            const activeChatMessages = (Data || []).filter(msg => (
                                ((msg.senderProfileId?._id === activeProfileId) || (msg.senderProfileId?._id === channelId)) &&
                                (((msg.channelTypeId?._id || msg.channel) === activeProfileId) || ((msg.channelTypeId?._id || msg.channel) === channelId)) &&
                                (msg.merchantId === merchantId)
                            )).map(msg => {
                                const {
                                    guid,
                                    senderProfileId,
                                    channel, content,
                                    contentType,
                                    channelTypeId,
                                    fileCaption,
                                    file: fileUri,
                                    read,
                                    merchantId,
                                    applicationId,
                                    createdAt
                                } = msg || {}

                                const receiverId = channel || channelTypeId?._id
                                let lightMsg = {
                                    id: guid || msg._id,
                                    senderId: senderProfileId?._id,
                                    receiverId,
                                    text: fileCaption || content,
                                    contentType,
                                    fileUri,
                                    read,
                                    merchantId,
                                    applicationId,
                                    date: createdAt?.split('T')[0],
                                    time: createdAt?.split('T')[1],
                                    reactions: {},
                                };

                                return lightMsg
                            })
                            //
                            mainAdaptors["activechatmessage"].setAll(state["activechatmessage"], activeChatMessages)
                        }
                    } catch (err) {
                        state.error = err || { message: "Unexpected error", code: "REDUX-addMatcher-itemsListReader" };
                    }
                })
            .addMatcher(
                sharedCrudApi.endpoints.itemsListReadr.matchFulfilled,
                (state, { payload: { entity, Data } }) => {
                    try {
                        if (entity) {
                            mainAdaptors[entity].setAll(state[entity], Data);
                        }
                        if (entity === "message") {
                            const activeChatPivot = useSelector(st => selectOneItemByGuid(st, "active_collection", "activechatpivot"))
                            const { activeProfileId, merchantId, channelId } = activeChatPivot || {}
                            const activeChatMessages = (Data || []).filter(msg => (
                                ((msg.senderProfileId?._id === activeProfileId) || (msg.senderProfileId?._id === channelId)) &&
                                (((msg.channelTypeId?._id || msg.channel) === activeProfileId) || ((msg.channelTypeId?._id || msg.channel) === channelId)) &&
                                (msg.merchantId === merchantId)
                            )).map(msg => {
                                const {
                                    guid,
                                    senderProfileId,
                                    channel, content,
                                    contentType,
                                    channelTypeId,
                                    fileCaption,
                                    file: fileUri,
                                    read,
                                    merchantId,
                                    applicationId,
                                    createdAt
                                } = msg || {}

                                const receiverId = channel || channelTypeId?._id
                                let lightMsg = {
                                    id: guid || msg._id,
                                    senderId: senderProfileId?._id,
                                    receiverId,
                                    text: fileCaption || content,
                                    contentType,
                                    fileUri,
                                    read,
                                    merchantId,
                                    applicationId,
                                    date: createdAt?.split('T')[0],
                                    time: createdAt?.split('T')[1],
                                    reactions: {},
                                };

                                return lightMsg
                            })
                            //
                            mainAdaptors["activechatmessage"].setAll(state["activechatmessage"], activeChatMessages)
                        }
                    } catch (err) {
                        state.error = err || { message: "Unexpected error", code: "REDUX-addMatcher-itemsListReadr" };
                    }
                })
            .addMatcher(
                sharedCrudApi.endpoints.itemDetailsViewer.matchFulfilled,
                (state, { payload: { entity, Data, applications, profiles, opportunities, messages } }) => {
                    try {
                        mainAdaptors[entity].upsertOne(state[entity], Data);
                        if (Array.isArray(applications) && applications.length) {
                            const applicationsWithProfileImageAtRoot = applications.map(apcn => ({ ...apcn, profileImage: apcn.profileId?.profileImage }))
                            mainAdaptors[entity].upsertMany(state["application"], applicationsWithProfileImageAtRoot);
                        } else if (Array.isArray(profiles) && profiles.length) {
                            mainAdaptors[entity].upsertMany(state["profile"], profiles);
                        } else if (Array.isArray(opportunities) && opportunities.length) {
                            mainAdaptors[entity].upsertMany(state["merchant"], opportunities);
                        }
                    } catch (err) {
                        state.error = err || { message: "Unexpected error", code: "REDUX-addMatcher-itemDetailsViewer" };
                    }
                })
            .addMatcher(
                sharedCrudApi.endpoints.itemFieldsUpdater.matchFulfilled,
                (state, { payload: { entity, Data } }) => {
                    mainAdaptors[entity].upsertOne(state[entity], Data);
                })
            .addMatcher(
                sharedCrudApi.endpoints.itemRemover.matchFulfilled,
                (state, { payload: { entity, entityGuid } }) => {
                    if (entity) {
                        mainAdaptors[entity].removeOne(state[entity], entityGuid);
                    }
                })
            .addMatcher(
                sharedCrudApi.endpoints.streamDataReader.matchFulfilled,
                (state, { payload: { Data, entity } }) => {
                    try {
                        if (Array.isArray(Data)) {
                            if (entity && state[entity]) {
                                const data = Data.map(da => ({ ...da, guid: da._id }))
                                mainAdaptors[entity].upsertMany(state[entity], data)
                                if (entity === "message") {
                                    const activeChatPivot = useSelector(st => selectOneItemByGuid(st, "active_collection", "activechatpivot"))
                                    const { activeProfileId, merchantId, channelId } = activeChatPivot || {}
                                    const activeChatMessages = (Data || []).filter(msg => (
                                        ((msg.senderProfileId?._id === activeProfileId) || (msg.senderProfileId?._id === channelId)) &&
                                        (((msg.channelTypeId?._id || msg.channel) === activeProfileId) || ((msg.channelTypeId?._id || msg.channel) === channelId)) &&
                                        (msg.merchantId === merchantId)
                                    )).map(msg => {
                                        const {
                                            guid,
                                            senderProfileId,
                                            channel, content,
                                            contentType,
                                            channelTypeId,
                                            fileCaption,
                                            file: fileUri,
                                            read,
                                            merchantId,
                                            applicationId,
                                            createdAt
                                        } = msg || {}

                                        const receiverId = channel || channelTypeId?._id
                                        let lightMsg = {
                                            id: guid || msg._id,
                                            senderId: senderProfileId?._id,
                                            receiverId,
                                            text: fileCaption || content,
                                            contentType,
                                            fileUri,
                                            read,
                                            merchantId,
                                            applicationId,
                                            date: createdAt?.split('T')[0],
                                            time: createdAt?.split('T')[1],
                                            reactions: {},
                                        };

                                        return lightMsg
                                    })
                                    //
                                    mainAdaptors["activechatmessage"].setAll(state["activechatmessage"], activeChatMessages)
                                }
                            } else {
                                console.warn(`undefined state[${entity}] in sharedMainState->sharedCrudApi.endpoints.streamDataReader.matchFulfilled`)
                            }
                        }
                    } catch (err) {
                        state.error = err || { message: "Unexpected error", code: "REDUX-addMatcher-streamDataReader" };
                    }
                })
            .addMatcher(
                sharedCrudApi.endpoints.httpMessageSender.matchFulfilled,
                (state, { payload }) => {
                    const { topic: entity, Data } = payload;
                    if (["message", "notification"].includes(entity) && Data?._id) {
                        mainAdaptors[entity].upsertOne(state[entity], { ...Data, guid: Data._id })
                    }
                });
    },
});

export const sharedStateReducer = mainSlice.reducer;
export const {
    setActiveProfile,
    getUsrCredentials,
    streamDataReceivedCallback,
    setActiveChatMessages,
    setActiveChatPivot,
    saveDownloadedImageData,
} = mainSlice.actions;

//======================= state selectors (helper functions) =============================

const selectListx = (state, entity) => {
    // const entityData = state.sharedstateslice[entity];
    // if (!entityData) {
    //     console.warn(`Entity "${entity}" not found in state.`);
    //     return [];
    // }
    // const selector = mainAdaptors[entity]?.getSelectors(stt => stt.sharedstateslice[entity]);
    // if (!selector) {
    //     console.warn(`Selector for entity "${entity}" is not available.`);
    //     return [];
    // }
    // try {
    //     return createSelector(
    //         () => entityData, // Input selector: Get the entity data from state
    //         (entityData) => selector.selectAll(entityData) || [] // Output selector: Use the adapter's selectAll method
    //     )(state);
    // } catch (error) {
    //     console.error(`Error in selectList for entity "${entity}":`, error);
    //     return [];
    // }
}

const selectList = (state, entity) => {
    return createSelector(
        [(state) => state, (x) => entity],
        (state, entity) => {
            try {
                if (!entity) {
                    return [];
                }
                const entities = state?.sharedstateslice[entity]?.entities;
                return state?.sharedstateslice[entity]?.ids.map(id => entities[id]);
            } catch (err) {
                return [];
            }
        }
    )(state);
};

const selectOneItemByGuidx = (state, entity, guid) => {
    // const selector = mainAdaptors[entity]?.getSelectors(stt => stt.sharedstateslice[entity]);
    // if (!selector) {
    //     console.warn(`Selector for entity "${entity}" is not available.`);
    //     return {};
    // }
    // try {
    //     //const item = selector?.selectById(state, guid);
    //     //return item || {};
    //     return createSelector(
    //         (state) => state.sharedstateslice[entity],
    //         (entityData) => selector?.selectById(entityData, guid) || {}
    //     )(state);
    // } catch (error) {
    //     console.error(`Error in selectOneItemByGuid for entity "${entity}" and guid "${guid}":`, error);
    //     return {};
    // }
}

const selectOneItemByGuid = (state, entity, guid) => {
    return createSelector(
        [(state) => state, (x) => entity, (x) => guid],
        (state, entity, guid) => {
            try {
                if (!entity) {
                    return {};
                }
                if (!guid) {
                    return {};
                }
                return state?.sharedstateslice[entity]?.entities[guid] || {};
            } catch (err) {
                return {};
            }
        }
    )(state);
};

const selectManyItemsByFieldx = (state, entity, field, value) => {
    // if (!entity) {
    //     console.warn("Entity name is required.");
    //     return [];
    // }

    // const entityData = state?.sharedstateslice[entity];
    // if (!entityData) {
    //     console.warn(`Entity "${entity}" not found in state.`);
    //     return [];
    // }

    // const selector = mainAdaptors[entity]?.getSelectors(stt => stt.sharedstateslice[entity]);
    // if (!selector) {
    //     console.warn(`Selector for entity "${entity}" is not available.`);
    //     return [];
    // }

    // try {
    //     //const result = selector?.selectAll(state).filter(item => item[field] === value) || [];
    //     //return result;
    //     return createSelector(
    //         (state) => state.sharedstateslice[entity],
    //         (entityData) => {
    //             const allItems = selector?.selectAll(entityData) || [];
    //             return allItems.filter(item => item[field] === value);
    //         }
    //     )(state);
    // } catch (error) {
    //     console.error(`Error in selectManyItemsByField for entity "${entity}" and field "${field}":`, error);
    //     return [];
    // }
};

const selectManyItemsByField = (state, entity, field, value) => {
    return createSelector(
        [(state) => state, (x) => entity, (x) => field, (x) => value],
        (state, entity, field, value) => {
            try {
                if (!state) {
                    return [];
                }
                if (!entity) {
                    return [];
                }
                if (!field) {
                    return [];
                }
                if (!value) {
                    return [];
                }
                const entities = state?.sharedstateslice[entity]?.entities;
                return state?.sharedstateslice[entity]?.ids.filter(id => entities[id][field] === value).map(id => entities[id]);
            } catch (err) {
                return [];
            }
        }
    )(state);
};

export {
    selectList,
    selectOneItemByGuid,
    selectManyItemsByField,
};