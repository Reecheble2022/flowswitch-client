// eslint-disable-next-line no-unused-vars
// import { createEntityAdapter } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
// import { sharedCrudApi } from "../api/sharedCrud";

export var optionsAdaptors = {}
export var optionsInixoStates = {}

const sharedDropDownsSlice = createSlice({
    name: 'shareddropdownsslice',
    initialState: optionsInixoStates,
    reducers: {},
    extraReducers: (builder) => {
        // builder
        //     .addMatcher(
        //         sharedCrudApi.endpoints.listOptions.matchFulfilled,
        //         (state, { payload: { entity, Data } }) => {
        //             optionsAdaptors[entity].upsertMany(state[entity], Data);
        //         })
        //     .addMatcher(
        //         sharedCrudApi.endpoints.listOptionz.matchFulfilled,
        //         (state, { payload: { entity, Data } }) => {
        //             optionsAdaptors[entity].upsertMany(state[entity], Data);
        //         });
    },
});

export const sharedDropDwnsReducer = sharedDropDownsSlice.reducer;

//=================================================

const selectListOptions = (state, entity) => {
    const selector = optionsAdaptors[entity]?.getSelectors(stt => stt.shareddropdownsslice[entity]);
    if (!selector) {
        console.warn(`Selector for entity "${entity}" is not available.`);
        return [];
    }
    return selector?.selectAll(state) || [];
}

export {
    selectListOptions
};