import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import batchReducer from './slices/batchSlice';
import declarationReducer from './slices/declarationSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        batches: batchReducer,
        declarations: declarationReducer,
        users: userReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
});

export default store; 