import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchUsers = createAsyncThunk(
    'users/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/admin/users');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Có lỗi xảy ra khi tải danh sách người dùng' });
        }
    }
);

export const createUser = createAsyncThunk(
    'users/create',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/admin/users', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Có lỗi xảy ra khi tạo người dùng' });
        }
    }
);

export const updateUser = createAsyncThunk(
    'users/update',
    async ({ id, ...userData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/admin/users/${id}`, userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Có lỗi xảy ra khi cập nhật người dùng' });
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/admin/users/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Có lỗi xảy ra khi xóa người dùng' });
        }
    }
);

const userSlice = createSlice({
    name: 'users',
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
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Có lỗi xảy ra';
            });
    }
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer; 