import { configureStore } from '@reduxjs/toolkit';
import schemaAnalyzerReducer from '../features/schema-analyzer/store/schemaAnalyzerSlice';

export const store = configureStore({
    reducer: {
        schemaAnalyzer: schemaAnalyzerReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
