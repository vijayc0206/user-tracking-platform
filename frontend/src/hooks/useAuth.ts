import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '../store';
import {
  login as loginAction,
  register as registerAction,
  logout as logoutAction,
  clearError,
} from '../store/slices/authSlice';
import { LoginCredentials, RegisterData } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginAction(credentials));
      if (loginAction.fulfilled.match(result)) {
        navigate('/dashboard');
        return true;
      }
      return false;
    },
    [dispatch, navigate]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const result = await dispatch(registerAction(data));
      if (registerAction.fulfilled.match(result)) {
        navigate('/dashboard');
        return true;
      }
      return false;
    },
    [dispatch, navigate]
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
    navigate('/login');
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearAuthError,
  };
};
