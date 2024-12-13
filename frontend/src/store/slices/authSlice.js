import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Đăng nhập thất bại' });
        }
    }
);

export const checkAuth = createAsyncThunk(
    'auth/check',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: false,
        error: null
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.loading = false;
            localStorage.removeItem('token');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Đăng nhập thất bại';
            })
            .addCase(checkAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.loading = false;
                state.user = null;
            });
    }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 