import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Use hash routing instead of direct href
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },
  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  googleLogin: async (tokenId) => {
    const response = await api.post('/auth/google', { tokenId });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },
};

export const eventsAPI = {
  getAllEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },
  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  getFeaturedEvents: async () => {
    const response = await api.get('/events/featured');
    return response.data;
  },
  getUpcomingEvents: async () => {
    const response = await api.get('/events/upcoming');
    return response.data;
  },
  getEventsByCategory: async (category) => {
    const response = await api.get(`/events/category/${category}`);
    return response.data;
  },
  getLocations: async () => {
    const response = await api.get('/events/locations');
    return response.data;
  },
  getSeatAvailability: async (eventId) => {
    const response = await api.get(`/events/${eventId}/seats`);
    // FIX: Backend returns nested structure { success, data: { seatLayout, availableSeats, totalSeats } }
    // Frontend expects { success, data: { seatLayout: {...} } }
    if (response.data.success && response.data.data) {
      return {
        success: response.data.success,
        data: response.data.data  // This contains seatLayout, availableSeats, totalSeats
      };
    }
    return response.data;
  },
  fetchLiveEvents: async (city, limit) => {
    const response = await api.get('/events/live/fetch', { params: { city, limit } });
    return response.data;
  },
  syncLiveEvents: async (city, limit) => {
    const response = await api.get('/events/live/sync', { params: { city, limit } });
    return response.data;
  },
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },
};

export const bookingsAPI = {
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  processPayment: async (bookingId, paymentDetails) => {
    const response = await api.post('/bookings/payment', { bookingId, paymentDetails });
    return response.data;
  },
  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  cancelBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },
};

export const usersAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
  getDashboard: async () => {
    const response = await api.get('/users/dashboard');
    return response.data;
  },
};

export default api;