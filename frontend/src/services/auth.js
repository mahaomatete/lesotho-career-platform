import api from './api';

// Auth service object with all methods
const authService = {
  // Register new user
  async register(userData) {
    try {
      console.log('📝 Auth Service: Sending registration request...');
      const response = await api.post('/auth/register', userData);
      console.log('✅ Auth Service: Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auth Service: Registration error:', error);
      throw error;
    }
  },

  // Login user
  async login(credentials) {
    try {
      console.log('🔐 Auth Service: Sending login request...', {
        email: credentials.email,
        passwordLength: credentials.password.length
      });

      const response = await api.post('/auth/login', credentials);
      console.log('✅ Auth Service: Login response received:', response.data);
      
      if (response.data.success) {
        console.log('✅ Auth Service: Storing token and user data');
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        console.log('✅ Auth Service: Login successful');
      } else {
        console.log('❌ Auth Service: Login failed in response:', response.data.message);
      }
      return response.data;
    } catch (error) {
      console.error('❌ Auth Service: Login API error:', error);
      
      // Enhanced error handling
      if (error.response) {
        // Server responded with error status
        const serverError = error.response.data;
        console.error('❌ Auth Service: Server error response:', serverError);
        throw new Error(serverError.message || `Login failed: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('❌ Auth Service: No response received:', error.request);
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      } else {
        // Something else happened
        console.error('❌ Auth Service: Other error:', error.message);
        throw new Error('Login failed: ' + error.message);
      }
    }
  },

  // Verify email (kept for compatibility)
  async verifyEmail(token) {
    try {
      const response = await api.post('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      console.error('Auth Service: Verify email error:', error);
      throw error;
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Auth Service: Forgot password error:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('Auth Service: Reset password error:', error);
      throw error;
    }
  },

  // Get user profile
  async getProfile() {
    try {
      console.log('👤 Auth Service: Getting user profile...');
      const response = await api.get('/auth/profile');
      console.log('✅ Auth Service: Profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auth Service: Get profile error:', error);
      throw error;
    }
  },

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Auth Service: Update profile error:', error);
      throw error;
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      console.error('Auth Service: Change password error:', error);
      throw error;
    }
  },

  // Logout function
  logout() {
    console.log('🚪 Auth Service: Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ Auth Service: Auth data cleared from localStorage');
    // Redirect to login page
    window.location.href = '/login';
  }
};

// Named exports for individual functions
export const registerUser = authService.register;
export const loginUser = authService.login;
export const verifyEmail = authService.verifyEmail;
export const forgotPassword = authService.forgotPassword;
export const resetPassword = authService.resetPassword;
export const getProfile = authService.getProfile;
export const updateProfile = authService.updateProfile;
export const changePassword = authService.changePassword;
export const logout = authService.logout;

// Default export of the service object
export default authService;