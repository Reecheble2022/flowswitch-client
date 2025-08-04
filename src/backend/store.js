import { configureStore } from "@reduxjs/toolkit";
import { appiiSlice } from "./api/apiSlice";
import { sharedStateReducer } from "./features/sharedMainState";
import { sharedDropDwnsReducer } from "./features/sharedDropdownsState";

export const store = configureStore({
  reducer: {
    sharedstateslice: sharedStateReducer,
    shareddropdownsslice: sharedDropDwnsReducer,
    [appiiSlice.reducerPath]: appiiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false
    }).concat(appiiSlice.middleware)
  },
});
