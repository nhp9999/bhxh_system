import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchBatches = createAsyncThunk(
    'batches/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/declaration-batches');
            return response.data;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const createBatch = createAsyncThunk(
    'batches/create',
    async (batchData, { rejectWithValue }) => {
        try {
            const payload = {
                ...batchData,
                month: parseInt(batchData.month),
                year: parseInt(batchData.year),
                batch_number: parseInt(batchData.batch_number)
            };

            const response = await api.post('/declaration-batches', payload);
            return response.data;
        } catch (error) {
            if (error.response?.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue({ message: 'Có lỗi xảy ra khi tạo đợt kê khai' });
        }
    }
);

export const updateBatch = createAsyncThunk(
    'batches/update',
    async ({ id, ...batchData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/declaration-batches/${id}`, batchData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const deleteBatch = createAsyncThunk(
    'batches/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/declarations/employee/batch/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Có lỗi xảy ra khi xóa đợt kê khai' });
        }
    }
);

export const submitBatch = createAsyncThunk(
    'batches/submit',
    async (batchId, { rejectWithValue }) => {
        try {
            const response = await api.post(`/declaration-batches/${batchId}/submit`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Có lỗi xảy ra khi gửi đợt kê khai' });
        }
    }
);

const batchSlice = createSlice({
    name: 'batches',
    initialState: {
        items: [],
        loading: false,
        error: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch batches
            .addCase(fetchBatches.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBatches.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchBatches.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create batch
            .addCase(createBatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBatch.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
            })
            .addCase(createBatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update batch
            .addCase(updateBatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBatch.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateBatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete batch
            .addCase(deleteBatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBatch.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter(item => item.id !== action.payload);
            })
            .addCase(deleteBatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Submit batch
            .addCase(submitBatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitBatch.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(submitBatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError } = batchSlice.actions;
export default batchSlice.reducer; 