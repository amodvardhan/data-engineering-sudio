import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SchemaAnalyzerState {  // Added export
  status: string | null;
  statusSeverity: 'error' | 'warning' | 'info' | 'success' | null;
}

const initialState: SchemaAnalyzerState = {
  status: null,
  statusSeverity: null,
};

export const schemaAnalyzerSlice = createSlice({  // Added export
  name: 'schemaAnalyzer',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<{
      status: string | null;
      severity?: 'error' | 'warning' | 'info' | 'success';
    }>) => {
      state.status = action.payload.status;
      state.statusSeverity = action.payload.severity || null;
    },
    clearStatus: (state) => {
      state.status = null;
      state.statusSeverity = null;
    },
  },
});

export const { setStatus, clearStatus } = schemaAnalyzerSlice.actions;
export default schemaAnalyzerSlice.reducer;
