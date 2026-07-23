import React, { useState } from 'react';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';

const PaymentPortal = () => {
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  // Demo data
  const event = { title: 'Shreya Ghoshal Concert' };
  const selectedSeats = [{ row: 'C', seatNumber: '8' }, { row: 'C', seatNumber: '7' }];
  const totalAmount = 2938;

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleInputChange = (field, value) => {
    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value);
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'cardHolder') {
      value = value.toUpperCase();
    }

    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!paymentDetails.cardNumber || paymentDetails.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    if (!paymentDetails.cardHolder || paymentDetails.cardHolder.length < 3) {
      newErrors.cardHolder = 'Please enter cardholder name';
    }

    if (!paymentDetails.expiryDate || paymentDetails.expiryDate.length !== 5) {
      newErrors.expiryDate = 'Invalid date';
    } else {
      const [month, year] = paymentDetails.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;

      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Invalid month';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card expired';
      }
    }

    if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Payment successful! 🎉');
      setPaymentDetails({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
      });
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Payment failed. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#e5e7eb',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7e22ce 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'rgba(88, 28, 135, 0.5)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        maxWidth: '560px',
        width: '100%',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: '8px',
          marginTop: 0
        }}>
          Payment Details
        </h1>

        {/* Event Info */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{
            fontSize: '15px',
            color: '#c4b5fd',
            margin: '0 0 4px 0'
          }}>
            Event: {event.title}
          </p>
          <p style={{
            fontSize: '15px',
            color: '#c4b5fd',
            margin: '0 0 12px 0'
          }}>
            Seats: {selectedSeats.map(s => `${s.row}${s.seatNumber}`).join(', ')}
          </p>
          <p style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            margin: 0
          }}>
            Total: ₹{totalAmount}
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card Number */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#e5e7eb',
              marginBottom: '8px'
            }}>
              Card Number
            </label>
            <input
              type="text"
              value={paymentDetails.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              style={{
                ...inputStyle,
                borderColor: errors.cardNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#a78bfa';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.cardNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.15)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
            />
            {errors.cardNumber && (
              <p style={{
                marginTop: '6px',
                fontSize: '13px',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                margin: '6px 0 0 0'
              }}>
                <AlertCircle size={14} />
                {errors.cardNumber}
              </p>
            )}
          </div>

          {/* Expiry and CVV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e5e7eb',
                marginBottom: '8px'
              }}>
                Expiry Date
              </label>
              <input
                type="text"
                value={paymentDetails.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="MM/YY"
                maxLength={5}
                style={{
                  ...inputStyle,
                  borderColor: errors.expiryDate ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a78bfa';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.expiryDate ? '#ef4444' : 'rgba(255, 255, 255, 0.15)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
              />
              {errors.expiryDate && (
                <p style={{
                  marginTop: '6px',
                  fontSize: '13px',
                  color: '#fca5a5',
                  margin: '6px 0 0 0'
                }}>
                  {errors.expiryDate}
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e5e7eb',
                marginBottom: '8px'
              }}>
                CVV
              </label>
              <input
                type="text"
                value={paymentDetails.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="123"
                maxLength={4}
                style={{
                  ...inputStyle,
                  borderColor: errors.cvv ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a78bfa';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.cvv ? '#ef4444' : 'rgba(255, 255, 255, 0.15)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
              />
              {errors.cvv && (
                <p style={{
                  marginTop: '6px',
                  fontSize: '13px',
                  color: '#fca5a5',
                  margin: '6px 0 0 0'
                }}>
                  {errors.cvv}
                </p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#e5e7eb',
              marginBottom: '8px'
            }}>
              Cardholder Name
            </label>
            <input
              type="text"
              value={paymentDetails.cardHolder}
              onChange={(e) => handleInputChange('cardHolder', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="JOHN DOE"
              style={{
                ...inputStyle,
                borderColor: errors.cardHolder ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#a78bfa';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.cardHolder ? '#ef4444' : 'rgba(255, 255, 255, 0.15)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
            />
            {errors.cardHolder && (
              <p style={{
                marginTop: '6px',
                fontSize: '13px',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                margin: '6px 0 0 0'
              }}>
                <AlertCircle size={14} />
                {errors.cardHolder}
              </p>
            )}
          </div>

          {errors.submit && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <p style={{
                fontSize: '13px',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0
              }}>
                <AlertCircle size={16} />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '12px'
          }}>
            <button
              onClick={() => {
                setPaymentDetails({
                  cardNumber: '',
                  cardHolder: '',
                  expiryDate: '',
                  cvv: '',
                });
                setErrors({});
              }}
              disabled={processing}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#e5e7eb',
                fontSize: '16px',
                fontWeight: '600',
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: processing ? 0.5 : 1
              }}
              onMouseEnter={(e) => !processing && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
              onMouseLeave={(e) => !processing && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              style={{
                flex: 1,
                padding: '14px',
                background: processing ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(90deg, #ec4899 0%, #a855f7 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: processing ? 'none' : '0 10px 30px rgba(236, 72, 153, 0.4)'
              }}
              onMouseEnter={(e) => !processing && (e.target.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => !processing && (e.target.style.transform = 'translateY(0)')}
            >
              {processing ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        input::placeholder {
          color: rgba(156, 163, 175, 0.5);
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default PaymentPortal;