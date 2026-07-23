import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Ticket, Search, ArrowRight, Sparkles, MapPin, Star, ChevronRight, Loader, Clock, Tag, Mail, CheckCircle, Home, Settings, LogOut, User, BarChart, CalendarDays, CreditCard, FileText, Download, Bell, Menu, X, Trash2, Plus, Edit, Shield } from 'lucide-react';
import SeatSelection from '../components/SeatSelection';

const GOOGLE_CLIENT_ID = import.meta?.env?.VITE_GOOGLE_CLIENT_ID || '818746544645-tik4d3p74emie41cuhtk5tctv4ftnrbr.apps.googleusercontent.com';

// API Base URL - Uses environment variable in production
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Services
const eventsAPI = {
  getEventById: async (eventId) => {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}`);
      const data = await response.json();
      return { success: response.ok, data: data.data || data };
    } catch (error) {
      console.error('Error fetching event:', error);
      return { success: false, message: error.message };
    }
  },
  getLocations: async () => {
    try {
      const response = await fetch(`${API_BASE}/events/locations`);
      const data = await response.json();
      return { success: response.ok, data: data.data || [] };
    } catch (error) {
      console.error('Error fetching locations:', error);
      return { success: false, message: error.message };
    }
  },
  getSeatAvailability: async (eventId) => {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/seats`);
      const data = await response.json();
      return { success: response.ok, data: data.data || [] };
    } catch (error) {
      console.error('Error fetching seat availability:', error);
      return { success: false, message: error.message };
    }
  }
};

const bookingsAPI = {
  createBooking: async (bookingData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });
      const data = await response.json();
      return { success: response.ok, data: data.data || data };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, message: error.message };
    }
  }
};

// PaymentPortal Component
const PaymentPortal = ({ event, selectedSeats, totalAmount, onPaymentSuccess, onCancel }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const seatsLabel = selectedSeats?.length
    ? selectedSeats.map((seat) => `${seat.row}${seat.seatNumber}`).join(', ')
    : 'General Admission';

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setPaymentData((prev) => ({ ...prev, [name]: formattedValue }));
    setError('');
  };

  const validateForm = () => {
    if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 13) {
      setError('Enter a valid card number to continue.');
      return false;
    }
    if (!paymentData.expiryDate || paymentData.expiryDate.length !== 5) {
      setError('Enter the card expiry date in MM/YY format.');
      return false;
    }
    const [month, year] = paymentData.expiryDate.split('/');
    const safeMonth = Number(month);
    const safeYear = Number(year);
    const today = new Date();
    const currentYear = today.getFullYear() % 100;
    const currentMonth = today.getMonth() + 1;
    if (Number.isNaN(safeMonth) || safeMonth < 1 || safeMonth > 12) {
      setError('Expiry month looks incorrect.');
      return false;
    }
    if (Number.isNaN(safeYear) || safeYear < currentYear || (safeYear === currentYear && safeMonth < currentMonth)) {
      setError('This card appears to be expired.');
      return false;
    }
    if (!paymentData.cvv || paymentData.cvv.length < 3) {
      setError('Enter the 3 or 4 digit CVV from the back of your card.');
      return false;
    }
    if (!paymentData.cardHolder.trim()) {
      setError('Add the cardholder name as it appears on the card.');
      return false;
    }
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onPaymentSuccess({
        cardNumber: paymentData.cardNumber,
        expiryDate: paymentData.expiryDate,
        cvv: paymentData.cvv,
        cardHolder: paymentData.cardHolder.trim()
      });
    }, 1200);
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
        <div className="payment-modal-header">
          <h2 id="payment-modal-title">Secure Checkout</h2>
          <button
            type="button"
            className="payment-close-button"
            onClick={onCancel}
            aria-label="Close payment dialog"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="payment-summary">
          <div className="payment-summary-row">
            <span className="payment-summary-label">Event</span>
            <span className="payment-summary-value">{event?.title || 'Selected Event'}</span>
          </div>
          <div className="payment-summary-row">
            <span className="payment-summary-label">Seats</span>
            <span className="payment-summary-value">{seatsLabel}</span>
          </div>
          <div className="payment-summary-total">
            <span>Total Payable</span>
            <strong>₹{totalAmount}</strong>
          </div>
        </div>

        {error && (
          <div className="payment-error" role="alert">
            {error}
          </div>
        )}

        <form className="payment-form" onSubmit={handleSubmit} noValidate>
          <div className="payment-field">
            <label className="payment-label" htmlFor="payment-card-number">
              Card Number
            </label>
            <input
              id="payment-card-number"
              name="cardNumber"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="payment-input"
              value={paymentData.cardNumber}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="payment-field payment-row">
            <div>
              <label className="payment-label" htmlFor="payment-expiry">
                Expiry (MM/YY)
              </label>
              <input
                id="payment-expiry"
                name="expiryDate"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                maxLength={5}
                className="payment-input"
                value={paymentData.expiryDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="payment-label" htmlFor="payment-cvv">
                CVV
              </label>
              <input
                id="payment-cvv"
                name="cvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                className="payment-input"
                value={paymentData.cvv}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="payment-field">
            <label className="payment-label" htmlFor="payment-card-holder">
              Cardholder Name
            </label>
            <input
              id="payment-card-holder"
              name="cardHolder"
              type="text"
              autoComplete="cc-name"
              placeholder="As printed on the card"
              className="payment-input"
              value={paymentData.cardHolder}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="payment-actions">
            <button
              type="button"
              className="payment-button secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="payment-button primary" disabled={loading}>
              {loading ? (
                <span className="payment-loading">
                  <span className="payment-loading-spinner" aria-hidden="true" />
                  Processing
                </span>
              ) : (
                'Pay Now'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// BookingConfirmation Component
const BookingConfirmation = ({ booking, onBackToHome }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-400" size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-white">Booking Confirmed!</h2>
        <p className="text-gray-300 mb-6">
          Your booking has been successfully confirmed. A confirmation email has been sent to your registered email address.
        </p>
        <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
          <p className="text-gray-300 mb-2">Booking ID: {booking._id || 'BK123456'}</p>
          <p className="text-gray-300 mb-2">Event: {booking.event?.title || 'Event Name'}</p>
          <p className="text-gray-300 mb-2">Date: {booking.event?.date ? new Date(booking.event.date).toLocaleDateString() : 'Event Date'}</p>
          <p className="text-gray-300 mb-2">Seats: {booking.selectedSeats?.map(s => `${s.row}${s.seatNumber}`).join(', ') || 'Seat Numbers'}</p>
          <p className="text-white font-bold">Total Paid: ₹{booking.totalPrice || '0'}</p>
        </div>
        <button
          onClick={onBackToHome}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition text-white"
        >
          Back to Events
        </button>
      </div>
    </div>
  );
};

// Simple Router Component
const Router = ({ children }) => {
  const getPath = () => {
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#/') return '/';
    return hash.replace('#', '');
  };

  const [currentPath, setCurrentPath] = useState(getPath());

  useEffect(() => {
    const handleHashChange = () => {
      const newPath = getPath();
      setCurrentPath(newPath);
      window.scrollTo(0, 0);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return children(currentPath);
};

// Dashboard Page Component
const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    avatarPreview: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = API_BASE;

  useEffect(() => {
    // Check authentication before loading dashboard
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.hash = '#/login';
      return;
    }
    
    fetchUserProfile();
    fetchUserEvents();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      const profile = data.data || data;
      setUserProfile({
        name: profile?.name || 'User',
        email: profile?.email || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        avatar: profile?.avatar || '',
        avatarPreview: profile?.avatar || ''
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUserProfile({
        name: 'User',
        email: '',
        phone: '',
        address: '',
        avatar: '',
        avatarPreview: ''
      });
      
      // If unauthorized, redirect to login
      if (err.message?.includes('401') || err.message?.includes('token') || err.message?.includes('authorized')) {
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
      }
    }
  };

  const fetchUserEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user events');
      }
      
      const data = await response.json();
      setUserEvents(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user events:', err);
      setError(err.message || 'Failed to load your bookings. Please try again.');
      setLoading(false);
      
      // If unauthorized, redirect to login
      if (err.message?.includes('401') || err.message?.includes('token') || err.message?.includes('authorized')) {
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.hash = '#/login';
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const maxSizeInMB = 2;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      alert(`Image is too large. Please choose a file under ${maxSizeInMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUserProfile((prev) => ({
        ...prev,
        avatar: reader.result || '',
        avatarPreview: reader.result || ''
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again to update your profile.');
      window.location.hash = '#/login';
      return;
    }

    if (!userProfile.name.trim()) {
      alert('Name is required.');
      return;
    }

    if (!userProfile.email.trim()) {
      alert('Email is required.');
      return;
    }

    try {
      setProfileSaving(true);

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userProfile.name.trim(),
          email: userProfile.email.trim(),
          phone: userProfile.phone || '',
          address: userProfile.address || '',
          avatar: userProfile.avatar || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      const updatedProfile = data.data || {};
      setUserProfile((prev) => ({
        ...prev,
        name: updatedProfile.name ?? prev.name,
        email: updatedProfile.email ?? prev.email,
        phone: updatedProfile.phone ?? prev.phone,
        address: updatedProfile.address ?? prev.address,
        avatar: updatedProfile.avatar ?? prev.avatar,
        avatarPreview: updatedProfile.avatar ?? prev.avatarPreview
      }));

      alert('Profile updated successfully.');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err.message || 'Unable to update profile right now.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAccountAction = async (action) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again to manage your account.');
      window.location.hash = '#/login';
      return;
    }

    const confirmAction = () => {
      if (action === 'deactivate') {
        return window.confirm('Are you sure you want to deactivate your account? You can contact support to reactivate.');
      }
      if (action === 'delete') {
        return window.confirm('This will permanently delete your account and cancel upcoming bookings. Continue?');
      }
      return true;
    };

    if (!confirmAction()) {
      return;
    }

    try {
      setAccountActionLoading(action);

      if (action === 'export') {
        const response = await fetch(`${API_BASE_URL}/users/export`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to export data.');
        }

        const payload = data.data || data;
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'eventora-user-data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('Your data export has started downloading.');
      } else if (action === 'deactivate') {
        const response = await fetch(`${API_BASE_URL}/users/account/deactivate`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to deactivate account.');
        }

        alert('Account deactivated. You will now be logged out.');
        handleLogout();
      } else if (action === 'delete') {
        const response = await fetch(`${API_BASE_URL}/users/account`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete account.');
        }

        alert('Account deleted successfully.');
        handleLogout();
      }
    } catch (err) {
      console.error('Account action error:', err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setAccountActionLoading('');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;

    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again to manage bookings.');
      window.location.hash = '#/login';
      return;
    }

    try {
      setCancellingBookingId(bookingId);

      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel booking.');
      }

      alert('Booking cancelled successfully.');
      if (selectedBooking && (selectedBooking._id || selectedBooking.id) === bookingId) {
        setSelectedBooking(null);
      }
      fetchUserEvents();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.message || 'Error cancelling booking. Please try again.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleDownloadTicket = (booking) => {
    if (!booking) return;

    const loadAndGenerate = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const event = booking.event || {};

      doc.setFillColor(147, 51, 234);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT TICKET', 105, 20, { align: 'center' });

      let yPos = 50;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text(event.title || 'Event', 20, yPos);
      yPos += 15;

      doc.setFontSize(12);
      doc.text(`Date: ${event.date ? formatDate(event.date) : 'N/A'}`, 20, yPos);
      yPos += 7;
      doc.text(`Time: ${event.time || 'TBD'}`, 20, yPos);
      yPos += 7;
      doc.text(`Location: ${event.location || 'TBD'}`, 20, yPos);
      yPos += 7;
      doc.text(`Seats: ${booking.selectedSeats?.map((s) => `${s.row}${s.seatNumber}`).join(', ') || 'N/A'}`, 20, yPos);
      yPos += 10;
      doc.text(`Booking Reference: ${booking.bookingReference || booking._id}`, 20, yPos);
      yPos += 10;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ₹${booking.totalPrice}`, 20, yPos);

      doc.save(`ticket-${booking._id || 'ticket'}.pdf`);
    };

    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = loadAndGenerate;
      script.onerror = () => alert('Failed to load PDF generator. Please try again.');
      document.head.appendChild(script);
    } else {
      loadAndGenerate();
    }
  };

  const openBookingDetails = (booking, switchToTickets = false) => {
    if (booking) {
      setSelectedBooking(booking);
      if (switchToTickets) {
        setActiveTab('tickets');
      }
    }
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
  };

  const isBookingCancelable = (booking) => {
    if (!booking) return false;
    const eventDate = booking.event?.date ? new Date(booking.event.date) : null;
    if (!eventDate) return false;
    return booking.status === 'confirmed' && eventDate >= new Date();
  };

  const canCancelSelectedBooking = isBookingCancelable(selectedBooking);

  const renderOverview = () => {
    const upcomingCount = userEvents.filter(e => e.event && new Date(e.event.date) >= new Date() && e.status === 'confirmed').length;
    const pastCount = userEvents.filter(e => e.event && new Date(e.event.date) < new Date()).length;
    const cancelledCount = userEvents.filter(e => e.status === 'cancelled').length;
    const totalSpent = userEvents.filter(e => e.paymentStatus === 'paid').reduce((sum, e) => sum + (e.totalPrice || 0), 0);
    const totalTickets = userEvents.reduce((sum, e) => sum + (e.numberOfTickets || 0), 0);

    return (
      <div className="w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upcoming Events</h3>
              <CalendarDays className="text-purple-400" size={24} />
            </div>
            <p className="text-3xl font-bold mb-2">{upcomingCount}</p>
            <p className="text-sm text-gray-400">Events you're attending</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Spent</h3>
              <CreditCard className="text-purple-400" size={24} />
            </div>
            <p className="text-3xl font-bold mb-2">₹{totalSpent}</p>
            <p className="text-sm text-gray-400">On event tickets</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Bookings</h3>
              <BarChart className="text-purple-400" size={24} />
            </div>
            <p className="text-3xl font-bold mb-2">{userEvents.length}</p>
            <p className="text-sm text-gray-400">All bookings</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Tickets</h3>
              <Ticket className="text-purple-400" size={24} />
            </div>
            <p className="text-3xl font-bold mb-2">{totalTickets}</p>
            <p className="text-sm text-gray-400">Tickets purchased</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Booking Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Upcoming Events</span>
                <span className="font-bold text-blue-400">{upcomingCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Past Events</span>
                <span className="font-bold text-green-400">{pastCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Cancelled</span>
                <span className="font-bold text-red-400">{cancelledCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setActiveTab('tickets');
                  setTicketFilterStatus('all');
                }}
                className="w-full px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition text-left flex items-center gap-3"
              >
                <Ticket size={20} className="text-purple-400" />
                <span>View My Tickets</span>
              </button>
              <button
                onClick={() => window.location.hash = '#/events'}
                className="w-full px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition text-left flex items-center gap-3"
              >
                <Calendar size={20} className="text-purple-400" />
                <span>Browse Events</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="w-full px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition text-left flex items-center gap-3"
              >
                <User size={20} className="text-purple-400" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {userEvents.length > 0 ? (
              userEvents.slice(0, 5).map(booking => {
                const event = booking.event || {};
                return (
                  <div
                    key={booking._id || booking.id}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                    onClick={() => openBookingDetails(booking)}
                  >
                    <img 
                      src={event.imageUrl || event.image || 'https://picsum.photos/seed/event/500/750'} 
                      alt={event.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-grow">
                      <h4 className="font-semibold">{event.title || 'Event'}</h4>
                      <p className="text-sm text-gray-400">{event.date ? formatDate(event.date) : 'N/A'} • {event.location || 'Location TBD'}</p>
                      <p className="text-xs text-gray-500 mt-1">₹{booking.totalPrice || 0} • {booking.numberOfTickets || 0} ticket(s)</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        booking.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-400'
                          : booking.status === 'confirmed' && event.date && new Date(event.date) >= new Date()
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {booking.status === 'cancelled' ? 'Cancelled' : booking.status === 'confirmed' && event.date && new Date(event.date) >= new Date() ? 'Upcoming' : 'Completed'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No events yet. Browse events to get started!</p>
                <a href="#/events" className="mt-4 inline-block px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition">
                  Browse Events
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEvents = () => (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Events</h2>
        <a href="#/events" className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition">
          Browse More Events
        </a>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="animate-spin text-purple-400" size={48} />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-red-400 mb-4">Failed to load events</p>
            <p className="text-gray-300 text-sm mb-4">{error}</p>
            <button
              onClick={fetchUserEvents}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : userEvents.length === 0 ? (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <Calendar className="mx-auto mb-6 text-purple-400" size={64} />
            <h3 className="text-2xl font-bold mb-4">No Events Yet</h3>
            <p className="text-gray-400 mb-6">
              You haven't registered for any events yet. Explore our events page to find something exciting!
            </p>
            <a href="#/events" className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition">
              Browse Events
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userEvents.map(booking => {
            const event = booking.event || {};
            return (
              <div key={booking._id || booking.id} className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300">
                <div className="h-32 overflow-hidden">
                  <img 
                    src={event.imageUrl || event.image || 'https://picsum.photos/seed/event/500/750'} 
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300">
                      {event.category || 'Event'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      booking.status === 'confirmed' && event.date && new Date(event.date) >= new Date()
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {booking.status === 'confirmed' && event.date && new Date(event.date) >= new Date() ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{event.title || 'Event'}</h3>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Calendar size={14} />
                      <span className="truncate">{event.date ? formatDate(event.date) : 'Date TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <MapPin size={14} />
                      <span className="truncate">{event.location || 'Location TBD'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">₹{booking.totalPrice || 0}</span>
                    <button
                      onClick={() => openBookingDetails(booking)}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderTickets = () => {
    const filteredBookings = ticketFilterStatus === 'all' 
      ? userEvents 
      : userEvents.filter(booking => {
          const event = booking.event || {};
          if (ticketFilterStatus === 'upcoming') {
            return booking.status === 'confirmed' && event.date && new Date(event.date) >= new Date();
          } else if (ticketFilterStatus === 'past') {
            return event.date && new Date(event.date) < new Date();
          } else if (ticketFilterStatus === 'cancelled') {
            return booking.status === 'cancelled';
          }
          return true;
        });

    return (
      <div className="w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Tickets</h2>
          <div className="flex gap-2">
            <select
              value={ticketFilterStatus}
              onChange={(e) => setTicketFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Tickets</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past Events</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-purple-400" size={48} />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-red-400 mb-4">Failed to load tickets</p>
              <p className="text-gray-300 text-sm mb-4">{error}</p>
              <button
                onClick={fetchUserEvents}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
              <Ticket className="mx-auto mb-6 text-purple-400" size={64} />
              <h3 className="text-2xl font-bold mb-4">No Tickets Found</h3>
              <p className="text-gray-400 mb-6">
                {ticketFilterStatus === 'all' 
                  ? "You haven't purchased any tickets yet. Explore our events page to find something exciting!"
                  : `No ${ticketFilterStatus} tickets found.`
                }
              </p>
              <a href="#/events" className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition">
                Browse Events
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const event = booking.event || {};
              const isUpcoming = booking.status === 'confirmed' && event.date && new Date(event.date) >= new Date();
              const canCancel = isUpcoming && booking.status !== 'cancelled';

              return (
                <div key={booking._id || booking.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-32 h-32 overflow-hidden rounded-lg flex-shrink-0">
                        <img 
                          src={event.imageUrl || event.image || 'https://picsum.photos/seed/event/500/750'} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold mb-2">{event.title || 'Event'}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={16} />
                                <span>{event.date ? formatDate(event.date) : 'N/A'}</span>
                              </div>
                              {event.time && (
                                <div className="flex items-center gap-1.5">
                                  <Clock size={16} />
                                  <span>{event.time}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <MapPin size={16} />
                                <span>{event.location || 'Location TBD'}</span>
                              </div>
                            </div>
                            {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-400 mb-1">Seats:</p>
                                <div className="flex flex-wrap gap-2">
                                  {booking.selectedSeats.map((seat, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300">
                                      {seat.row}{seat.seatNumber}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs mb-2 ${
                              booking.status === 'cancelled'
                                ? 'bg-red-500/20 text-red-400'
                                : isUpcoming
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {booking.status === 'cancelled' ? 'Cancelled' : isUpcoming ? 'Upcoming' : 'Completed'}
                            </span>
                            <p className="text-2xl font-bold mb-2">₹{booking.totalPrice || 0}</p>
                            <p className="text-xs text-gray-400">Ref: {booking.bookingReference || booking._id?.slice(-8)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                          <button
                            onClick={() => handleDownloadTicket(booking)}
                            className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition text-purple-300 text-sm flex items-center gap-2"
                          >
                            <Download size={16} />
                            Download Ticket
                          </button>
                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking(booking._id || booking.id)}
                              disabled={cancellingBookingId === (booking._id || booking.id)}
                              className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition text-red-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {cancellingBookingId === (booking._id || booking.id) ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                          )}
                          <button
                            onClick={() => openBookingDetails(booking)}
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-white text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    );
  };

  const renderProfile = () => (
    <div className="w-full p-6">
      <h2 className="text-2xl font-bold mb-6">My Profile</h2>
      
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full mb-4 border-2 border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center overflow-hidden">
              {userProfile.avatarPreview ? (
                <img
                  src={userProfile.avatarPreview}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="text-purple-400" size={48} />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={handleAvatarButtonClick}
              className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition"
            >
              Change Photo
            </button>
          </div>
          
          <div className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <input 
                  type="email" 
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  placeholder="+91 (555) 123-4567"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                <input 
                  type="text" 
                  value={userProfile.address}
                  onChange={(e) => setUserProfile({ ...userProfile, address: e.target.value })}
                  placeholder="Mumbai, India"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
              <textarea 
                rows="4"
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none transition text-white resize-none"
              ></textarea>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="w-full p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive emails about upcoming events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-400">Receive push notifications on your device</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-400">Receive text messages for event reminders</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Profile Visibility</p>
                <p className="text-sm text-gray-400">Make your profile visible to other users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Event History</p>
                <p className="text-sm text-gray-400">Show your past events on your profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handleAccountAction('export')}
              disabled={accountActionLoading === 'export'}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-left w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {accountActionLoading === 'export' ? 'Preparing export...' : 'Export My Data'}
            </button>
            <button
              type="button"
              onClick={() => handleAccountAction('deactivate')}
              disabled={accountActionLoading === 'deactivate'}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-left w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {accountActionLoading === 'deactivate' ? 'Deactivating...' : 'Deactivate Account'}
            </button>
            <button
              type="button"
              onClick={() => handleAccountAction('delete')}
              disabled={accountActionLoading === 'delete'}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-left w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {accountActionLoading === 'delete' ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Top Navigation Bar */}
      <header className="bg-slate-900/95 backdrop-blur-lg border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="#/" className="flex items-center gap-2">
                <Sparkles className="text-purple-400" size={28} />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Eventora</span>
              </a>
              
              {/* Mobile Menu Button removed per requirements */}

              {/* Horizontal Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    activeTab === 'overview' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Home size={18} />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    activeTab === 'events' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CalendarDays size={18} />
                  <span>My Events</span>
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    activeTab === 'tickets' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Ticket size={18} />
                  <span>My Tickets</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    activeTab === 'profile' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User size={18} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    activeTab === 'settings' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <User className="text-purple-400" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium">{userProfile.name}</p>
                  <p className="text-xs text-gray-400">Premium Member</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 pt-20">
          <div className="bg-slate-900/95 border-b border-white/10">
            <nav className="flex flex-col p-4 gap-2">
              <button
                onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-lg transition flex items-center gap-3 text-left ${
                  activeTab === 'overview' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Home size={20} />
                <span>Overview</span>
              </button>
              <button
                onClick={() => { setActiveTab('events'); setMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-lg transition flex items-center gap-3 text-left ${
                  activeTab === 'events' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CalendarDays size={20} />
                <span>My Events</span>
              </button>
              <button
                onClick={() => { setActiveTab('tickets'); setMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-lg transition flex items-center gap-3 text-left ${
                  activeTab === 'tickets' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Ticket size={20} />
                <span>My Tickets</span>
              </button>
              <button
                onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-lg transition flex items-center gap-3 text-left ${
                  activeTab === 'profile' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <User size={20} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-lg transition flex items-center gap-3 text-left ${
                  activeTab === 'settings' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
              <div className="border-t border-white/10 my-2"></div>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition flex items-center gap-3 text-left"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'tickets' && renderTickets()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeBookingDetails}
        >
          <div
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">Booking Details</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedBooking.bookingReference || selectedBooking._id}
                </p>
              </div>
              <button onClick={closeBookingDetails} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Event</p>
                <p className="font-semibold">{selectedBooking.event?.title || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Date</p>
                  <p>{selectedBooking.event?.date ? formatDate(selectedBooking.event.date) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Time</p>
                  <p>{selectedBooking.event?.time || 'TBD'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Location</p>
                  <p>{selectedBooking.event?.location || 'TBD'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Venue</p>
                  <p>{selectedBooking.event?.venue || 'TBD'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Tickets</p>
                <p>{selectedBooking.numberOfTickets} ticket(s)</p>
              </div>
              {selectedBooking.selectedSeats && selectedBooking.selectedSeats.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Seats</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.selectedSeats.map((seat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-sm text-purple-300"
                      >
                        {seat.row}
                        {seat.seatNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Price</p>
                <p className="text-2xl font-bold">₹{selectedBooking.totalPrice || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Payment Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    selectedBooking.paymentStatus === 'paid'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {selectedBooking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row md:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTicket(selectedBooking)}
                  className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition text-purple-300 text-sm flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Ticket
                </button>
                {canCancelSelectedBooking && (
                  <button
                    type="button"
                    onClick={() => handleCancelBooking(selectedBooking._id || selectedBooking.id)}
                    disabled={cancellingBookingId === (selectedBooking._id || selectedBooking.id)}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition text-red-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancellingBookingId === (selectedBooking._id || selectedBooking.id)
                      ? 'Cancelling...'
                      : 'Cancel Booking'}
                  </button>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeBookingDetails}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-white text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Events Page Component
const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');

  const API_BASE_URL = API_BASE;

  useEffect(() => {
    // Auto-sync upcoming events on page load
    syncAndFetchEvents();
  }, []);

  const applyEventsToState = (eventsList = [], { mergeLocations = true } = {}) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = eventsList.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    setEvents(upcomingEvents);
    setFilteredEvents(upcomingEvents);

    const uniqueCategories = [...new Set(upcomingEvents.map((event) => event.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
    setCategories(uniqueCategories);

    const uniqueLocations = [...new Set(upcomingEvents.map((event) => event.location).filter(Boolean))];

    setLocations((prev) => {
      if (!mergeLocations || !prev || prev.length === 0) {
        return uniqueLocations.sort((a, b) => a.localeCompare(b));
      }
      const merged = new Set([...prev, ...uniqueLocations]);
      return Array.from(merged).sort((a, b) => a.localeCompare(b));
    });

    return upcomingEvents;
  };

  const fetchUpcomingEventsFromAPI = async (limit = 60) => {
    const response = await fetch(`${API_BASE_URL}/events/upcoming?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch events');
    const data = await response.json();
    const eventsList = data.data || data;
    return applyEventsToState(eventsList);
  };

  const refreshLocationsFromAPI = async () => {
    try {
      const locationsResponse = await eventsAPI.getLocations();
      if (locationsResponse.success && locationsResponse.data) {
        setLocations((prev) => {
          const merged = new Set([
            ...(prev || []),
            ...locationsResponse.data.filter(Boolean),
          ]);
          return Array.from(merged).sort((a, b) => a.localeCompare(b));
        });
      }
    } catch (err) {
      console.error('Error fetching locations from API:', err);
    }
  };

  const syncAndFetchEvents = async () => {
    setLoading(true);
    setError(null);
    let initialEventsCount = 0;

    try {
      const initialEvents = await fetchUpcomingEventsFromAPI(60);
      initialEventsCount = initialEvents.length;
      await refreshLocationsFromAPI();
      if (initialEventsCount > 0) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    }

    try {
      const syncResponse = await fetch(`${API_BASE_URL}/events/live/sync?limit=80`);
      if (syncResponse.ok) {
        await fetchUpcomingEventsFromAPI(60);
        await refreshLocationsFromAPI();
      } else {
        console.warn('Failed to sync upcoming events');
      }
    } catch (err) {
      console.error('Error syncing upcoming events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch only upcoming events
      const response = await fetch(`${API_BASE_URL}/events/upcoming`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      const eventsList = data.data || data;
      
      // Filter to only show upcoming events (future dates)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingEvents = eventsList.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });
      
      setEvents(upcomingEvents);
      setFilteredEvents(upcomingEvents);
      
      const uniqueCategories = [...new Set(upcomingEvents.map(event => event.category).filter(Boolean))];
      const uniqueLocations = [...new Set(upcomingEvents.map(event => event.location).filter(Boolean))];
      setCategories(uniqueCategories);
      setLocations(uniqueLocations);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...events];

    // Ensure we only show upcoming events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(event => event.location === selectedLocation);
    }

    if (selectedDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        
        switch (selectedDate) {
          case 'today':
            return eventDate.getTime() === today.getTime();
          case 'week':
            const weekLater = new Date(today);
            weekLater.setDate(weekLater.getDate() + 7);
            return eventDate >= today && eventDate <= weekLater;
          case 'month':
            const monthLater = new Date(today);
            monthLater.setMonth(monthLater.getMonth() + 1);
            return eventDate >= today && eventDate <= monthLater;
          default:
            return true;
        }
      });
    }

    // Apply sorting (default to date ascending for most recent first)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          // Default: sort by date (most recent first)
          return new Date(a.date) - new Date(b.date);
      }
    });

    setFilteredEvents(filtered);
  }, [searchTerm, selectedCategory, selectedLocation, selectedDate, events, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedDate('all');
    setSortBy('date');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEventClick = (eventId) => {
    window.location.hash = `#/events/${eventId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Eventora
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#/events" className="hover:text-purple-400 transition">Events</a>
            <a href="#/about" className="hover:text-purple-400 transition">About</a>
            <a href="#/contact" className="hover:text-purple-400 transition">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#/login" className="px-6 py-2 hover:text-purple-400 transition">Login</a>
            <a href="#/signup" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105">
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      <div className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              Discover Amazing <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Upcoming Events</span>
            </h1>
            <p className="text-gray-300 text-lg">Discover amazing events across India</p>
          </div>

          <div className="mb-12">
            <div className="mb-6">
              <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-full px-6 py-4 flex items-center gap-3 border border-white/20">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-white border-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-4 flex-wrap">
              <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 border border-white/20">
                <Tag size={18} className="text-purple-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent outline-none text-white border-none"
                >
                  <option value="all" style={{ background: '#1a1a2e' }}>All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} style={{ background: '#1a1a2e' }}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 border border-white/20">
                <MapPin size={18} className="text-purple-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-transparent outline-none text-white border-none"
                >
                  <option value="all" style={{ background: '#1a1a2e' }}>All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc} style={{ background: '#1a1a2e' }}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 border border-white/20">
                <Calendar size={18} className="text-purple-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent outline-none text-white border-none"
                >
                  <option value="all" style={{ background: '#1a1a2e' }}>Any Time</option>
                  <option value="today" style={{ background: '#1a1a2e' }}>Today</option>
                  <option value="week" style={{ background: '#1a1a2e' }}>This Week</option>
                  <option value="month" style={{ background: '#1a1a2e' }}>This Month</option>
                </select>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 border border-white/20">
                <ArrowRight size={18} className="text-purple-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent outline-none text-white border-none"
                >
                  <option value="date" style={{ background: '#1a1a2e' }}>Sort by Date</option>
                  <option value="price-low" style={{ background: '#1a1a2e' }}>Price: Low to High</option>
                  <option value="price-high" style={{ background: '#1a1a2e' }}>Price: High to Low</option>
                  <option value="name" style={{ background: '#1a1a2e' }}>Name: A to Z</option>
                </select>
              </div>

              <button
                onClick={handleResetFilters}
                className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20 transition hover:bg-white/20"
              >
                Reset Filters
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <div className="bg-white/10 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-2 border border-white/20">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-full transition ${viewMode === 'grid' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-400 hover:text-white'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-full transition ${viewMode === 'list' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-400 hover:text-white'}`}
                >
                  List
                </button>
              </div>
            </div>

            <div className="text-center text-gray-400 text-sm">
              {filteredEvents.length > 8 
                ? `Showing top 8 of ${filteredEvents.length} events` 
                : `Showing ${filteredEvents.length} of ${events.length} events`
              }
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader className="animate-spin text-purple-400" size={48} />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 max-w-md mx-auto">
                <p className="text-red-400 mb-4">Failed to load events</p>
                <p className="text-gray-300 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchEvents}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg">No events found matching your criteria</p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" : "space-y-4"}>
                    {filteredEvents.slice(0, 8).map((event) => (
                      <div 
                        key={event.id || event._id} 
                        className={`group relative bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300 ${viewMode === 'grid' ? 'hover:scale-105' : 'hover:translate-x-2'} cursor-pointer`}
                        onClick={() => handleEventClick(event.id || event._id)}
                      >
                        {viewMode === 'grid' ? (
                          <>
                            <div className="event-card-image-wrapper">
                              <img
                                src={event.imageUrl || 'https://picsum.photos/seed/event/500/750'}
                                alt={event.title}
                                className="event-card-image"
                                onError={(e) => {
                                  e.target.src = 'https://picsum.photos/seed/fallback/500/750';
                                }}
                              />
                            </div>

                            <div className="p-4">
                              <span className="inline-block px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs mb-2 text-purple-300">
                                {event.category}
                              </span>

                              <h3 className="text-sm font-bold mb-1 group-hover:text-purple-400 transition line-clamp-2">
                                {event.title}
                              </h3>

                              <p className="text-gray-300 text-xs mb-3 leading-relaxed line-clamp-2">
                                {event.description}
                              </p>

                              <div className="space-y-1 mb-3">
                                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                  <Calendar size={12} />
                                  <span className="truncate">{formatDate(event.date)}</span>
                                </div>
                                {event.time && (
                                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                    <Clock size={12} />
                                    <span>{event.time}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                  <MapPin size={12} />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <div>
                                  <span className="text-lg font-bold">
                                    ₹{event.price}
                                  </span>
                                </div>
                                <button className="px-4 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition">
                                  View
                                </button>
                              </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex gap-4 p-4">
                          <div className="event-card-thumb">
                            <img
                              src={event.imageUrl || 'https://picsum.photos/seed/event/500/750'}
                              alt={event.title}
                              className="event-card-image"
                              onError={(e) => {
                                e.target.src = 'https://picsum.photos/seed/fallback/500/750';
                              }}
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <span className="inline-block px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs mb-1 text-purple-300">
                                  {event.category}
                                </span>
                                <h3 className="text-base font-bold mb-1 group-hover:text-purple-400 transition line-clamp-1">
                                  {event.title}
                                </h3>
                                <p className="text-gray-300 text-xs mb-2 leading-relaxed line-clamp-2">
                                  {event.description}
                                </p>
                                <div className="flex flex-wrap gap-3 text-gray-400 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>{formatDate(event.date)}</span>
                                  </div>
                                  {event.time && (
                                    <div className="flex items-center gap-1">
                                      <Clock size={12} />
                                      <span>{event.time}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-lg font-bold mb-2">
                                  ₹{event.price}
                                </div>
                                <button className="px-4 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition">
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                  
                  {filteredEvents.length > 8 && (
                    <div className="text-center mt-8">
                      <a 
                        href="#/events" 
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105"
                      >
                        <span>View All Events</span>
                        <ArrowRight size={18} />
                      </a>
                      <p className="text-gray-400 text-sm mt-3">
                        Showing 8 of {filteredEvents.length} events
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <footer className="py-12 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-400" size={24} />
                <span className="text-xl font-bold">Eventora</span>
              </div>
              <p className="text-gray-400 text-sm">Your gateway to unforgettable experiences</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#/about" className="hover:text-purple-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Help Center</a></li>
                <li><a href="#/contact" className="hover:text-purple-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Twitter</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm pt-8 border-t border-white/10">
            © 2025 Eventora. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Event Detail Page Component with Seat Selection
const EventDetailPage = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [booking, setBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));

  const API_BASE_URL = API_BASE;

  const getCurrentEventHashParts = () => {
    const hashPart = window.location.hash.split('/events/')[1] || '';
    const [idPart, queryPart] = hashPart.split('?');
    return { eventId: idPart, query: queryPart };
  };

  const ensureAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      return true;
    }

    alert('Please login to continue with your booking.');
    const { eventId, query } = getCurrentEventHashParts();
    if (eventId) {
      const params = new URLSearchParams(query || '');
      params.set('continueBooking', '1');
      const hash = `#/events/${eventId}?${params.toString()}`;
      localStorage.setItem('postLoginRedirect', JSON.stringify({ hash }));
    }
    window.location.hash = '#/login';
    setIsAuthenticated(false);
    return false;
  };

  useEffect(() => {
    const { eventId, query } = getCurrentEventHashParts();
    if (eventId) {
      fetchEventDetails(eventId);
    } else {
      setError('Event ID not found');
      setLoading(false);
    }

    // If logged in and asked to continue booking, open seat selection
    const params = new URLSearchParams(query || '');
    if (localStorage.getItem('token') && params.get('continueBooking') === '1') {
      setTimeout(() => setShowSeatSelection(true), 300);
    }

    const handleStorage = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchEventDetails = async (eventId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsAPI.getEventById(eventId);
      if (response.success) {
        setEvent(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch event details');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message || 'Failed to load event');
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!ensureAuthenticated()) {
      return;
    }
    setShowSeatSelection(true);
  };

  const handleSeatsSelected = (seats) => {
    if (!ensureAuthenticated()) {
      return;
    }
    setSelectedSeats(seats);
    setShowSeatSelection(false);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    try {
      setProcessing(true);

      if (!ensureAuthenticated()) {
        setProcessing(false);
        return;
      }

      if (!event) throw new Error('Event not loaded');

      const normalizedPaymentDetails = {
        cardNumber: paymentDetails?.cardNumber || '',
        expiryDate: paymentDetails?.expiryDate || '',
        cvv: paymentDetails?.cvv || '',
        cardHolder: paymentDetails?.cardHolder || paymentDetails?.cardHolderName || ''
      };

      if (!normalizedPaymentDetails.cardHolder) {
        throw new Error('Cardholder name is required to complete the payment.');
      }

      const storageKey = `event-${event._id}-booked-seats`;
      let existingBookedSeats = [];

      // Read existing booked seats from localStorage
      try {
        const existing = localStorage.getItem(storageKey);
        if (existing) {
          existingBookedSeats = JSON.parse(existing);
        }
      } catch (err) {
        console.log('No existing bookings found in storage', err);
        existingBookedSeats = [];
      }

      // Note: Do not block on localStorage checks; authoritative check occurs on backend.

      // Reserve seats in localStorage immediately (lock)
      const allBookedSeats = [...existingBookedSeats, ...selectedSeats];
      try {
        localStorage.setItem(storageKey, JSON.stringify(allBookedSeats));
        console.log('Seats reserved in localStorage (locked):', selectedSeats);
      } catch (err) {
        console.error('Failed to reserve seats in localStorage', err);
        alert('Unable to reserve seats. Please try again.');
        return;
      }

      // Create booking in backend
      const bookingData = {
        eventId: event._id,
        numberOfTickets: selectedSeats.length,
        selectedSeats,
        paymentMethod: 'card',
        paymentDetails: normalizedPaymentDetails
      };

      const response = await bookingsAPI.createBooking(bookingData);

      if (response && response.success) {
        // Persist booked seats (best-effort)
        try {
          localStorage.setItem(storageKey, JSON.stringify(allBookedSeats));
        } catch (err) {
          console.warn('Failed to persist seats to localStorage after booking', err);
        }

        // store actual booking object (bookingsAPI returns { success, data })
        setBooking(response.data || response);
        setShowPayment(false);
        setShowConfirmation(true);
      } else {
        // Rollback localStorage to previous state
        try {
          localStorage.setItem(storageKey, JSON.stringify(existingBookedSeats));
          console.log('Rolled back seats in localStorage');
        } catch (rollbackErr) {
          console.error('Rollback failed', rollbackErr);
        }
        alert('Booking failed: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToHome = () => {
    window.location.hash = '#/events';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <Loader className="animate-spin text-purple-400" size={48} />
      </div>
    );
  }

  if (showConfirmation && booking) {
    return <BookingConfirmation booking={booking} onBackToHome={handleBackToHome} />;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
        <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-lg shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="#/" className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={32} />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Eventora</span>
            </a>
            <a href="#/events" className="text-gray-400 hover:text-purple-400 transition">← Back to Events</a>
          </div>
        </nav>
        <div className="pt-32 pb-20 px-6 text-center">
          <div className="max-w-md mx-auto bg-red-500/20 border border-red-500/50 rounded-2xl p-8">
            <p className="text-red-400 mb-4">{error || 'Event not found'}</p>
            <a href="#/events" className="px-6 py-3 bg-purple-500 rounded-full hover:bg-purple-600 transition">Browse Events</a>
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = event.price * (selectedSeats.length || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Eventora</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="#/events" className="text-gray-400 hover:text-purple-400 transition">← Back to Events</a>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Event Image and Basic Info */}
            <div>
              <div className="h-96 rounded-3xl overflow-hidden mb-6 relative group">
                <img 
                  src={event.imageUrl || 'https://picsum.photos/seed/event/500/750'} 
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/seed/fallback/500/750';
                  }}
                />
                {(event.source === 'bookmyshow' || event.source === 'tmdb') && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full text-xs font-semibold">
                    Live Event
                  </div>
                )}
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300">
                    {event.category}
                  </span>
                  {(event.source === 'bookmyshow' || event.source === 'tmdb') && (
                    <span className="inline-block px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 flex items-center gap-1">
                      <Sparkles size={12} />
                      Live from BookMyShow
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
                <p className="text-gray-300 mb-6 leading-relaxed">{event.description}</p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Event</span>
                    <span className="font-semibold">{event.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tickets</span>
                    <span>{selectedSeats.length} × ₹{event.price}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                    <span className="text-xl font-bold">Total Amount</span>
                    <span className="text-3xl font-bold text-purple-400">₹{totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Book Your Tickets</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Available Seats</span>
                  <span className="text-2xl font-bold text-purple-400">{event.availableSeats}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price per Ticket</span>
                  <span className="text-xl font-bold">₹{event.price}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Payment Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tickets</span>
                  <span className="font-semibold">{selectedSeats.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Price</span>
                  <span className="text-2xl font-bold text-purple-400">₹{totalAmount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              disabled={event.availableSeats === 0 || processing}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                'Book Now'
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Seat Selection Modal */}
      {showSeatSelection && event && (
        <SeatSelection
          event={event}
          onSeatsSelected={handleSeatsSelected}
          onCancel={() => setShowSeatSelection(false)}
          isAuthenticated={isAuthenticated}
          onRequireLogin={ensureAuthenticated}
        />
      )}

      {/* Payment Portal Modal */}
      {showPayment && event && selectedSeats.length > 0 && (
        <PaymentPortal
          event={event}
          selectedSeats={selectedSeats}
          totalAmount={totalAmount}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => {
            setShowPayment(false);
            setShowSeatSelection(true);
          }}
        />
      )}

      <footer className="py-12 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm">© 2025 Eventora. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Payment Page Component with Dummy Payment Form
const PaymentPage = () => {
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Test card details for user reference
  const TEST_CARDS = {
    visa: {
      number: '4111111111111111',
      expiry: '12/25',
      cvv: '123',
      name: 'Test User'
    },
    mastercard: {
      number: '5555555555554444',
      expiry: '12/25',
      cvv: '123',
      name: 'Test User'
    },
    amex: {
      number: '378282246310005',
      expiry: '12/25',
      cvv: '1234',
      name: 'Test User'
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('bookingDetails');
    if (stored) {
      setBookingDetails(JSON.parse(stored));
    } else {
      setError('No booking details found. Please start from the event page.');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format card number (add spaces every 4 digits)
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formatted.replace(/\s/g, '').length <= 19) {
        setPaymentData({ ...paymentData, [name]: formatted });
      }
    }

    // Format expiry date (MM/YY)
    else if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2').slice(0, 5);
      setPaymentData({ ...paymentData, [name]: formatted });
    }

    // CVV (3-4 digits)
    else if (name === 'cvv') {
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setPaymentData({ ...paymentData, [name]: formatted });
    }
    else {
      setPaymentData({ ...paymentData, [name]: value });
    }
    setError('');
  };

  const fillTestCard = (cardType) => {
    const card = TEST_CARDS[cardType];
    setPaymentData({
    cardNumber: card.number,
    expiryDate: card.expiry,
    cvv: card.cvv,
    cardHolder: card.name
    });
  };

  const API_BASE_URL = API_BASE;

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardHolder) {
      setError('Please fill in all payment details');
      setLoading(false);
      return;
    }

    // Validate card number length (remove spaces)
    const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      setError('Please enter a valid card number');
      setLoading(false);
      return;
    }

    // Validate expiry date
    const [month, year] = paymentData.expiryDate.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setError('Please enter a valid expiry date (MM/YY)');
      setLoading(false);
      return;
    }

    // Validate CVV
    if (paymentData.cvv.length < 3) {
      setError('Please enter a valid CVV');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to complete booking');
      }

      // Create booking first
      const bookingResponse = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: bookingDetails.eventId,
          numberOfTickets: bookingDetails.numberOfTickets,
          paymentMethod: 'card'
        })
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      const bookingData = await bookingResponse.json();
      const bookingId = bookingData.data._id;

      // Update payment status to paid (dummy payment)
      const paymentResponse = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentStatus: 'paid'
        })
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment processing failed');
      }

      // Clear booking details from session
      sessionStorage.removeItem('bookingDetails');

      // Show success and redirect
      setSuccess(true);
      setTimeout(() => {
        window.location.hash = '#/dashboard';
      }, 2000);

    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No booking details found'}</p>
          <a href="#/events" className="px-6 py-3 bg-purple-500 rounded-full hover:bg-purple-600 transition">Browse Events</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Eventora</span>
          </a>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {success ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-3xl p-12 text-center">
              <CheckCircle className="mx-auto mb-6 text-green-400" size={64} />
              <h2 className="text-3xl font-bold mb-4 text-green-400">Payment Successful!</h2>
              <p className="text-gray-300 mb-6">Your booking has been confirmed. Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              {/* Booking Summary */}
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 mb-8">
                <h2 className="text-2xl font-bold mb-6">Booking Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Event</span>
                    <span className="font-semibold">{bookingDetails.eventTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span>{new Date(bookingDetails.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location</span>
                    <span>{bookingDetails.eventLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tickets</span>
                    <span>{bookingDetails.numberOfTickets} × ₹{bookingDetails.pricePerTicket}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                    <span className="text-xl font-bold">Total Amount</span>
                    <span className="text-3xl font-bold text-purple-400">₹{bookingDetails.totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-6">Payment Details</h2>

                {/* Test Card Helper */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold mb-2 text-purple-300">💡 Test Card Numbers (Use any of these):</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Visa:</span>
                      <button onClick={() => fillTestCard('visa')} className="text-purple-400 hover:text-pink-400 transition underline">
                        Fill Visa Test Card
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Mastercard:</span>
                      <button onClick={() => fillTestCard('mastercard')} className="text-purple-400 hover:text-pink-400 transition underline">
                        Fill Mastercard Test Card
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">American Express:</span>
                      <button onClick={() => fillTestCard('amex')} className="text-purple-400 hover:text-pink-400 transition underline">
                        Fill Amex Test Card
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-white/5 rounded text-xs text-gray-400">
                    <p><strong>Card Number:</strong> Any of the test numbers above</p>
                    <p><strong>Expiry:</strong> 12/25 (or any future date)</p>
                    <p><strong>CVV:</strong> 123 (or 1234 for Amex)</p>
                    <p><strong>Name:</strong> Any name</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handlePayment} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:outline-none transition text-white text-lg tracking-widest" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={paymentData.expiryDate}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:outline-none transition text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentData.cvv}
                        onChange={handleChange}
                        placeholder="123"
                        maxLength={4}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:outline-none transition text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Card Holder Name</label>
                    <input
                      type="text"
                      name="cardHolder"
                      value={paymentData.cardHolder}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:outline-none transition text-white" />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        Pay ₹{bookingDetails.totalPrice} <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <a href="#/events" className="text-gray-400 hover:text-purple-400 transition text-sm">
                    ← Cancel and return to events
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Eventora
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#/events" className="hover:text-purple-400 transition">Events</a>
            <a href="#/about" className="hover:text-purple-400 transition">About</a>
            <a href="#/contact" className="hover:text-purple-400 transition">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#/login" className="px-6 py-2 hover:text-purple-400 transition">Login</a>
            <a href="#/signup" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105">
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              Discover Amazing <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Events</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8">Find and book tickets for the best events in your city</p>
            <a href="#/events" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105">
              Explore Events <ArrowRight size={20} />
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                <Calendar className="text-purple-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Browse Events</h3>
              <p className="text-gray-300">Discover a wide variety of events happening in your city, from concerts to workshops.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                <Ticket className="text-purple-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Easy Booking</h3>
              <p className="text-gray-300">Book tickets for your favorite events with just a few clicks. No hassle, no waiting.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                <Users className="text-purple-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Connect with Others</h3>
              <p className="text-gray-300">Meet like-minded people and make new connections at events you love.</p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to explore amazing events?</h2>
            <a href="#/events" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105">
              Get Started <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-400" size={24} />
                <span className="text-xl font-bold">Eventora</span>
              </div>
              <p className="text-gray-400 text-sm">Your gateway to unforgettable experiences</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#/about" className="hover:text-purple-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Help Center</a></li>
                <li><a href="#/contact" className="hover:text-purple-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Twitter</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm pt-8 border-t border-white/10">
            © 2025 Eventora. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// About Page Component
const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Eventora
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#/events" className="hover:text-purple-400 transition">Events</a>
            <a href="#/about" className="hover:text-purple-400 transition">About</a>
            <a href="#/contact" className="hover:text-purple-400 transition">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#/login" className="px-6 py-2 hover:text-purple-400 transition">Login</a>
            <a href="#/signup" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105">
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">About Eventora</h1>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-300 mb-4">
              Eventora was founded with a simple mission: to connect people with amazing events happening in their cities. 
              We believe that experiences are what make life meaningful, and we're dedicated to making it easier for everyone 
              to discover and participate in events that inspire, entertain, and educate.
            </p>
            <p className="text-gray-300">
              Since our launch in 2025, we've helped thousands of event organizers reach wider audiences and enabled 
              millions of people to discover events they love. From local workshops to international concerts, 
              Eventora is your trusted platform for all things events.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-gray-300">
                To create a world where everyone can easily discover and participate in events that enrich their lives, 
                fostering connections and communities through shared experiences.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-300">
                To provide the most comprehensive, user-friendly platform for event discovery and ticketing, 
                empowering both event organizers and attendees to create memorable experiences.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-400">Community</h3>
                <p className="text-gray-300">We believe in the power of bringing people together and fostering meaningful connections.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-400">Innovation</h3>
                <p className="text-gray-300">We constantly evolve our platform to provide the best possible experience for our users.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-400">Accessibility</h3>
                <p className="text-gray-300">We're committed to making events accessible to everyone, regardless of background or ability.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-400">Quality</h3>
                <p className="text-gray-300">We curate and promote high-quality events that provide real value to attendees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-400" size={24} />
                <span className="text-xl font-bold">Eventora</span>
              </div>
              <p className="text-gray-400 text-sm">Your gateway to unforgettable experiences</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#/about" className="hover:text-purple-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Help Center</a></li>
                <li><a href="#/contact" className="hover:text-purple-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Twitter</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm pt-8 border-t border-white/10">
            © 2025 Eventora. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Contact Page Component
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Eventora
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#/events" className="hover:text-purple-400 transition">Events</a>
            <a href="#/about" className="hover:text-purple-400 transition">About</a>
            <a href="#/contact" className="hover:text-purple-400 transition">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#/login" className="px-6 py-2 hover:text-purple-400 transition">Login</a>
            <a href="#/signup" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105">
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
              <p className="text-gray-300 mb-6">
                Have questions, feedback, or need help with your event? We'd love to hear from you. 
                Fill out the form and our team will get back to you as soon as possible.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-purple-400" size={20} />
                  <span>support@eventora.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-purple-400" size={20} />
                  <span>123 Event Street, Mumbai, India</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
                  <h3 className="text-xl font-bold mb-2">Thank You!</h3>
                  <p className="text-gray-300">Your message has been sent successfully. We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-400" size={24} />
                <span className="text-xl font-bold">Eventora</span>
              </div>
              <p className="text-gray-400 text-sm">Your gateway to unforgettable experiences</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#/about" className="hover:text-purple-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Help Center</a></li>
                <li><a href="#/contact" className="hover:text-purple-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Twitter</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm pt-8 border-t border-white/10">
            © 2025 Eventora. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Login Page Component
const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async (response) => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokenId: response.credential })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        // Post-login redirect handling
        const postLogin = localStorage.getItem('postLoginRedirect');
        if (postLogin) {
          try {
            const { hash } = JSON.parse(postLogin) || {};
            localStorage.removeItem('postLoginRedirect');
            if (hash) {
              window.location.hash = hash;
              return;
            }
          } catch (e) {
            localStorage.removeItem('postLoginRedirect');
          }
        }
        window.location.hash = '#/dashboard';
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Google OAuth script
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      initializeGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogleButton();
    };
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
    };
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  const initializeGoogleButton = () => {
    const buttonElement = document.getElementById('google-signin-button');
    if (!buttonElement) {
      // Retry after a short delay if element doesn't exist yet
      setTimeout(initializeGoogleButton, 100);
      return;
    }

    if (window.google && window.google.accounts) {
      try {
        if (!GOOGLE_CLIENT_ID) {
          console.warn(
            'Google Sign-In cannot initialise: missing VITE_GOOGLE_CLIENT_ID in the project environment variables.'
          );
          const fallbackButton = document.createElement('button');
          fallbackButton.className =
            'w-full px-6 py-3 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-3 border border-gray-300';
          fallbackButton.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000" fillRule="evenodd">
              <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335"/>
              <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.75 2.13c1.63-1.5 2.72-3.7 2.72-6.48z" fill="#4285F4"/>
              <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.75-2.13c-.76.53-1.78.9-3.21.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853"/>
            </g>
          </svg>
          <span>Sign in with Google</span>
        `;
          fallbackButton.onclick = () => {
            alert('Google Sign-In requires VITE_GOOGLE_CLIENT_ID to be defined in your frontend .env file.');
          };
          buttonElement.innerHTML = '';
          buttonElement.appendChild(fallbackButton);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn
        });
        
        // Clear any existing content
        buttonElement.innerHTML = '';
        
        window.google.accounts.id.renderButton(buttonElement, {
          theme: 'filled_black',
          size: 'large',
          width: 360,
          text: 'signup_with',
          shape: 'pill',
          logo_alignment: 'left'
        });
      } catch (error) {
        console.error('Error initializing Google button:', error);
        // Fallback button
        const fallbackButton = document.createElement('button');
        fallbackButton.className = 'w-full px-6 py-3 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-3 border border-gray-300';
        fallbackButton.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000" fillRule="evenodd">
              <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335"/>
              <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.75 2.13c1.63-1.5 2.72-3.7 2.72-6.48z" fill="#4285F4"/>
              <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.75-2.13c-.76.53-1.78.9-3.21.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853"/>
            </g>
          </svg>
          <span>Sign in with Google</span>
        `;
        fallbackButton.onclick = () => {
          alert('Google Sign-In requires VITE_GOOGLE_CLIENT_ID to be configured in your environment variables.');
        };
        buttonElement.innerHTML = '';
        buttonElement.appendChild(fallbackButton);
      }
    } else {
      // Fallback if Google script didn't load
      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement) {
        const fallbackButton = document.createElement('button');
        fallbackButton.className = 'w-full px-6 py-3 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-3 border border-gray-300';
        fallbackButton.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000" fillRule="evenodd">
              <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335"/>
              <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.75 2.13c1.63-1.5 2.72-3.7 2.72-6.48z" fill="#4285F4"/>
              <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.75-2.13c-.76.53-1.78.9-3.21.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853"/>
            </g>
          </svg>
          <span>Sign in with Google</span>
        `;
        fallbackButton.onclick = () => {
          alert('Google Sign-In is loading. Please wait a moment and try again.');
        };
        buttonElement.innerHTML = '';
        buttonElement.appendChild(fallbackButton);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Post-login redirect handling
        const postLogin = localStorage.getItem('postLoginRedirect');
        if (postLogin) {
          try {
            const { hash } = JSON.parse(postLogin) || {};
            localStorage.removeItem('postLoginRedirect');
            if (hash) {
              window.location.hash = hash;
              return;
            }
          } catch (e) {
            localStorage.removeItem('postLoginRedirect');
          }
        }
        window.location.hash = '#/dashboard';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center px-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <a href="#/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Eventora
            </span>
          </a>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
          {error && (
            <div className="mb-5 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition text-white placeholder:text-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition text-white placeholder:text-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0 cursor-pointer transition checked:bg-purple-500 checked:border-purple-500" 
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition">Remember me</span>
              </label>
              <a href="#/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 mt-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white/10 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-4">
              <div id="google-signin-button" className="w-full" style={{ minHeight: '42px' }}></div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <a href="#/signup" className="text-purple-400 hover:text-purple-300 transition font-medium">
                Sign up
              </a>
            </p>
          </div>

          <div className="mt-5 pt-5 border-t border-white/10 text-center">
            <a href="#/admin" className="text-sm text-purple-400 hover:text-purple-300 transition flex items-center justify-center gap-2">
              <Shield size={16} />
              Admin Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sign Up Page Component
const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and redirect to OTP verification
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', formData.email);
        window.location.hash = '#/verify-otp';
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center px-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <a href="#/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Eventora
            </span>
          </a>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-400">Join Eventora to discover amazing events</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" required />
              <span className="text-sm text-gray-300">
                I agree to the{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 transition">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 transition">
                  Privacy Policy
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <a href="#/login" className="text-purple-400 hover:text-purple-300 transition">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// OTP Verification Page Component
const OTPVerificationPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
    
    setError('');
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          otp: otpValue
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.hash = '#/dashboard';
        }, 2000);
      } else {
        setError(data.message || 'OTP verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      
      const response = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setError('');
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-400 z-50';
        successMsg.textContent = 'OTP sent successfully';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Resend OTP error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center px-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <a href="#/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Eventora
            </span>
          </a>
          <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-gray-400">We've sent a 6-digit code to your email</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
              <h3 className="text-xl font-bold mb-2">Email Verified!</h3>
              <p className="text-gray-300">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-4 text-center">Enter Verification Code</label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white text-xl"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 mb-2">Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  className="text-purple-400 hover:text-purple-300 transition"
                >
                  Resend Code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Forgot Password Page Component
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center px-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <a href="#/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="text-purple-400" size={32} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Eventora
            </span>
          </a>
          <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
          <p className="text-gray-400">Enter your email to reset your password</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          {success ? (
            <div className="text-center py-8">
              <Mail className="mx-auto mb-4 text-green-400" size={48} />
              <h3 className="text-xl font-bold mb-2">Email Sent!</h3>
              <p className="text-gray-300 mb-6">
                We've sent password reset instructions to your email.
              </p>
              <a href="#/login" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition text-white inline-block">
                Back to Login
              </a>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Remember your password?{' '}
                  <a href="#/login" className="text-purple-400 hover:text-purple-300 transition">
                    Sign in
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Admin Page Component
const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    price: '',
    totalSeats: '',
    imageUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = API_BASE;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAdminAccess();
    }
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.data && data.data.role === 'admin') {
        setIsAuthenticated(true);
        setUserRole('admin');
        fetchEvents();
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Error checking admin access:', err);
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    // Hardcoded admin credentials check
    const ADMIN_EMAIL = 'your-admin-email@example.com';
    const ADMIN_PASSWORD = 'your-secure-password';

    if (loginData.email !== ADMIN_EMAIL || loginData.password !== ADMIN_PASSWORD) {
      setLoginError('Invalid admin credentials. Access denied.');
      setLoginLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        await checkAdminAccess();
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (err) {
      setLoginError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/events`);
      const data = await response.json();
      if (response.ok) {
        setEvents(data.data || []);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          totalSeats: parseInt(formData.totalSeats) || 100
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowAddForm(false);
        setFormData({
          title: '',
          description: '',
          category: '',
          date: '',
          time: '',
          location: '',
          venue: '',
          price: '',
          totalSeats: '',
          imageUrl: ''
        });
        fetchEvents();
        alert('Event created successfully!');
      } else {
        setError(data.message || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        fetchEvents();
        alert('Event deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-md z-10">
          <div className="text-center mb-8">
            <a href="#/" className="inline-flex items-center gap-2 mb-6">
              <Shield className="text-purple-400" size={32} />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Eventora Admin
              </span>
            </a>
            <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
            <p className="text-gray-400">Sign in to manage events</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            {loginError && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{loginError}</p>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Signing in...' : 'Sign In as Admin'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="#/login" className="text-sm text-purple-400 hover:text-purple-300 transition">
                ← Back to User Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-lg border-b border-white/10 px-6 py-4 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-purple-400" size={28} />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#/events" className="text-gray-400 hover:text-white transition">
              View Events Page
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Event Management</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition flex items-center gap-2"
          >
            <Plus size={20} />
            {showAddForm ? 'Cancel' : 'Add New Event'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Add Event Form */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold mb-6">Add New Event</h2>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                    placeholder="e.g., Music, Sports, Comedy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                    placeholder="e.g., Mumbai, India"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Venue *</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                    placeholder="e.g., Wankhede Stadium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Seats *</label>
                  <input
                    type="number"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                    required
                    min="1"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="4"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition text-white resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-purple-400" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all">
                <div className="h-48 overflow-hidden">
                  <img
                    src={event.imageUrl || 'https://picsum.photos/seed/event/500/750'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300">
                      {event.category}
                    </span>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Event"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{event.description}</p>
                  <div className="space-y-1 text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ticket size={14} />
                      <span>₹{event.price} • {event.availableSeats || event.totalSeats} seats</span>
                    </div>
                  </div>
                  <a
                    href={`#/events/${event._id}`}
                    className="block w-full text-center px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition text-purple-300 text-sm"
                  >
                    View Event
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="mx-auto mb-6 text-purple-400" size={64} />
            <h3 className="text-2xl font-bold mb-4">No Events Found</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first event!</p>
          </div>
        )}
      </main>
    </div>
  );
};

// Main App Component with Router
export default function App() {
  return (
    <Router>
      {(currentPath) => {
        const path = currentPath.split('?')[0].startsWith('/') ? currentPath.split('?')[0].slice(1) : currentPath.split('?')[0];
        
        // Handle event detail pages (e.g., /events/123)
        if (path.startsWith('events/')) {
          return <EventDetailPage />;
        } else if (path === 'events') {
          return <EventsPage />;
        } else if (path === 'about') {
          return <AboutPage />;
        } else if (path === 'contact') {
          return <ContactPage />;
        } else if (path === 'login') {
          return <LoginPage />;
        } else if (path === 'signup') {
          return <SignUpPage />;
        } else if (path === 'verify-otp') {
          return <OTPVerificationPage />;
        } else if (path === 'forgot-password') {
          return <ForgotPasswordPage />;
        } else if (path === 'payment') {
          return <PaymentPage />;
        } else if (path === 'dashboard') {
          // Check authentication for dashboard
          const token = localStorage.getItem('token');
          if (!token) {
            window.location.hash = '#/login';
            return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg mb-4">Redirecting to login...</p>
              </div>
            </div>;
          }
          return <DashboardPage />;
        } else if (path === 'admin') {
          return <AdminPage />;
        }
        return <LandingPage />;
      }}
    </Router>
  );
};