import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchStatistics = createAsyncThunk(
    'statistics/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/statistics');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const statisticsSlice = createSlice({
    name: 'statistics',
    initialState: {
        data: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchStatistics.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchStatistics.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchStatistics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            });
    }
});

export default statisticsSlice.reducer; 