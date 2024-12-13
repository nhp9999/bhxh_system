import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const createDeclaration = createAsyncThunk(
    'declarations/create',
    async (declarationData, { rejectWithValue }) => {
        try {
            const response = await api.post('/declarations', declarationData);
            return response.data;
        } catch (error) {
            if (error.response?.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue({ message: 'Có lỗi xảy ra khi tạo kê khai' });
        }
    }
);

export const fetchDeclarations = createAsyncThunk(
    'declarations/fetchByBatchId',
    async ({ batchId }, { rejectWithValue }) => {
        try {
            const response = await api.get('/declarations', {
                params: { batch_id: batchId }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

export const fetchAllDeclarations = createAsyncThunk(
    'declarations/fetchAllForAdmin',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Không tìm thấy token');
            }

            const response = await api.get('/admin/declarations', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Fetch admin declarations error:', error);
            if (error.response?.status === 400) {
                return rejectWithValue({
                    message: error.response.data.message || 'Yêu cầu không hợp lệ'
                });
            }
            return rejectWithValue({
                message: error.message || 'Có lỗi xảy ra khi lấy danh sách kê khai'
            });
        }
    }
);

export const approveDeclaration = createAsyncThunk(
    'declarations/approve',
    async ({ declarationId, batchId }, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post(`/declarations/${declarationId}/approve`);
            await dispatch(fetchDeclarationsByBatch(batchId));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

export const rejectDeclaration = createAsyncThunk(
    'declarations/reject',
    async ({ declarationId, batchId }, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post(`/declarations/${declarationId}/reject`);
            await dispatch(fetchDeclarationsByBatch(batchId));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

export const fetchDeclarationsByBatch = createAsyncThunk(
    'declarations/fetchByBatch',
    async (batchId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/declarations/batch/${batchId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

export const submitBatch = createAsyncThunk(
    'declarations/submitBatch',
    async (batchId, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post(`/declarations/batch/${batchId}/submit`);
            await dispatch(fetchDeclarationsByBatch(batchId));
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Có lỗi xảy ra khi gửi đợt kê khai'
            );
        }
    }
);

const declarationSlice = createSlice({
    name: 'declarations',
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
            .addCase(fetchDeclarations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDeclarations.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchDeclarations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createDeclaration.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            .addCase(fetchAllDeclarations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllDeclarations.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchAllDeclarations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(approveDeclaration.pending, (state) => {
                state.loading = true;
            })
            .addCase(approveDeclaration.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(approveDeclaration.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(rejectDeclaration.pending, (state) => {
                state.loading = true;
            })
            .addCase(rejectDeclaration.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(rejectDeclaration.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchDeclarationsByBatch.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDeclarationsByBatch.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.error = null;
            })
            .addCase(fetchDeclarationsByBatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(submitBatch.pending, (state) => {
                state.loading = true;
            })
            .addCase(submitBatch.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(submitBatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError } = declarationSlice.actions;
export default declarationSlice.reducer; 