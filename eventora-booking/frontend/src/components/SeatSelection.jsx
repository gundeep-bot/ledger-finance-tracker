import React, { useState, useEffect, useCallback } from 'react';
import { eventsAPI } from '../services/api';

const SeatSelection = ({ event, onSeatsSelected, onCancel, isAuthenticated, onRequireLogin }) => {
  const [seatLayout, setSeatLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeatAvailability = useCallback(async () => {
    const eventId = event?._id || event?.id;
    
    if (!eventId) {
      console.error('No event ID provided');
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await eventsAPI.getSeatAvailability(eventId);
      
      console.log('API Response:', response);
      
      let seatLayoutData = null;
      
      if (response.success && response.data) {
        seatLayoutData = response.data.seatLayout || response.data;
      } else if (response.data) {
        seatLayoutData = response.data;
      } else if (response.seatLayout) {
        seatLayoutData = response.seatLayout;
      }
      
      console.log('Seat Layout Data:', seatLayoutData);
      
      const defaultLayout = {
        rows: 10,
        seatsPerRow: 10,
        layout: 'standard',
        bookedSeats: [],
        seatCategories: {}
      };
      
      if (seatLayoutData) {
        const layout = {
          rows: Number(seatLayoutData.rows) || defaultLayout.rows,
          seatsPerRow: Number(seatLayoutData.seatsPerRow) || defaultLayout.seatsPerRow,
          layout: seatLayoutData.layout || defaultLayout.layout,
          bookedSeats: Array.isArray(seatLayoutData.bookedSeats) ? seatLayoutData.bookedSeats : defaultLayout.bookedSeats,
          seatCategories: seatLayoutData.seatCategories || defaultLayout.seatCategories
        };
        
        console.log('Final Layout Config:', layout);
        setSeatLayout(layout);
        
        const booked = new Set();
        if (Array.isArray(layout.bookedSeats)) {
          layout.bookedSeats.forEach(seat => {
            if (seat && seat.row && seat.seat) {
              booked.add(`${seat.row}-${seat.seat}`);
            }
          });
        }
        setBookedSeats(booked);
      } else {
        console.log('Using default layout');
        setSeatLayout(defaultLayout);
      }
      
    } catch (err) {
      console.error('Error fetching seat availability:', err);
      setError(err.message || 'Failed to load seat layout');
      
      setSeatLayout({
        rows: 10,
        seatsPerRow: 10,
        layout: 'standard',
        bookedSeats: [],
        seatCategories: {}
      });
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    fetchSeatAvailability();
    
    // Refresh seat availability every 5 seconds to catch newly booked seats
    const interval = setInterval(() => {
      fetchSeatAvailability();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchSeatAvailability]);

  const toggleSeat = (row, seatNumber) => {
    const seatId = `${row}-${seatNumber}`;
    
    if (bookedSeats.has(seatId)) {
      return;
    }

    setSelectedSeats(prev => {
      const existingIndex = prev.findIndex(s => s.row === row && s.seatNumber === seatNumber);
      
      if (existingIndex >= 0) {
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        const maxSeats = event?.availableSeats || 100;
        if (prev.length >= maxSeats) {
          alert(`You can only select up to ${maxSeats} seats`);
          return prev;
        }
        return [...prev, { row, seatNumber }];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    
    // Check if user is authenticated (passed from parent component)
    if (isAuthenticated === false) {
      if (typeof onRequireLogin === 'function') {
        onRequireLogin();
      } else {
      alert('Please login to continue with booking');
      }
      return;
    }
    
    onSeatsSelected(selectedSeats);
  };

  // Seat button base style with 3D effect
  const getSeatButtonStyle = (isBooked, isSelected) => {
    const baseColor = isBooked ? '#4b5563' : isSelected ? '#9333ea' : '#10b981';
    const lightColor = isBooked ? '#6b7280' : isSelected ? '#a855f7' : '#34d399';
    const darkColor = isBooked ? '#374151' : isSelected ? '#7e22ce' : '#059669';
    
    return {
      width: '55px',
      height: '55px',
      minWidth: '55px',
      minHeight: '55px',
      maxWidth: '55px',
      maxHeight: '55px',
      margin: '0',
      padding: '0',
      border: 'none',
      borderRadius: '8px',
      background: isBooked 
        ? `linear-gradient(135deg, ${baseColor} 0%, ${darkColor} 100%)`
        : `linear-gradient(135deg, ${lightColor} 0%, ${baseColor} 50%, ${darkColor} 100%)`,
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 'bold',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      cursor: isBooked ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isBooked ? '0.5' : '1',
      transform: isSelected 
        ? 'perspective(1000px) rotateX(-5deg) translateY(-2px) scale(1.1)' 
        : 'perspective(1000px) rotateX(-5deg) translateY(0px) scale(1)',
      boxShadow: isSelected 
        ? '0 8px 16px rgba(0,0,0,0.4), 0 0 0 4px rgba(147, 51, 234, 0.4), inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
        : '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2), inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.15)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      lineHeight: '1',
      textAlign: 'center',
      verticalAlign: 'middle',
      boxSizing: 'border-box',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      appearance: 'none',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      flexShrink: '0',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      // Add 3D border effect
      borderTop: '2px solid rgba(255,255,255,0.3)',
      borderLeft: '2px solid rgba(255,255,255,0.2)',
      borderRight: '2px solid rgba(0,0,0,0.2)',
      borderBottom: '2px solid rgba(0,0,0,0.3)'
    };
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: '#0a0a1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '999999',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#1f1b2e',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.5)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #9333ea',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '20px', color: '#e0e7ff', fontSize: '16px' }}>Loading seats...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!seatLayout) {
    return (
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: '#0a0a1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '999999',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#1f1b2e',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ef4444', marginBottom: '20px', fontSize: '18px' }}>
            {error || 'Unable to load seat layout'}
          </p>
          <button onClick={onCancel} style={{
            padding: '12px 24px',
            backgroundColor: '#374151',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const rows = seatLayout.rows || 10;
  const seatsPerRow = seatLayout.seatsPerRow || 10;
  const rowLetters = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));

  return (
    <>
      <style>{`
        .seat-selection-overlay * {
          box-sizing: border-box;
        }
        .seat-selection-overlay {
          transform: none !important;
          zoom: 1 !important;
        }
        .seat-selection-overlay .seat-grid-container {
          transform: none !important;
          zoom: 1 !important;
          min-width: fit-content;
        }
        .seat-btn {
          width: 55px !important;
          height: 55px !important;
          min-width: 55px !important;
          min-height: 55px !important;
          max-width: 55px !important;
          max-height: 55px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
          font-weight: bold !important;
          font-size: 16px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          text-align: center !important;
          line-height: 1 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          flex-shrink: 0 !important;
          box-sizing: border-box !important;
          position: relative !important;
        }
        .seat-btn:hover:not(:disabled) {
          transform: perspective(1000px) rotateX(-8deg) translateY(-4px) scale(1.15) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.5), 0 0 0 2px rgba(147, 51, 234, 0.3), inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.25) !important;
        }
        .seat-btn:disabled {
          cursor: not-allowed !important;
        }
        .seat-row {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          width: 100% !important;
          justify-content: center !important;
          flex-wrap: nowrap !important;
        }
        .seat-row-container {
          display: flex !important;
          gap: 8px !important;
          flex-wrap: nowrap !important;
          flex-shrink: 0 !important;
        }
      `}</style>
      
      <div className="seat-selection-overlay" style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(10, 10, 30, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '999999',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '24px',
          maxWidth: '1400px',
          width: '100%',
          maxHeight: '95vh',
          overflowY: 'auto',
          overflowX: 'auto',
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          transform: 'none',
          zoom: '1'
        }}>
          {/* Header */}
          <div style={{
            position: 'sticky',
            top: '0',
            background: 'linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)',
            color: 'white',
            padding: '24px 28px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: '10'
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                Select Your Seats
              </h2>
              <p style={{
                color: '#e9d5ff',
                marginTop: '4px',
                marginBottom: '0',
                fontSize: '14px'
              }}>
                {event?.title || 'Choose your seats'}
              </p>
            </div>
            <button onClick={onCancel} style={{
              color: 'white',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              lineHeight: '1'
            }}>
              ×
            </button>
          </div>

          <div style={{
            padding: '32px 24px'
          }}>
            {/* Screen */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '16px 40px',
                borderRadius: '8px',
                maxWidth: '600px',
                margin: '0 auto 12px',
                boxShadow: '0 20px 40px -12px rgba(245, 158, 11, 0.4)'
              }}>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0',
                  letterSpacing: '0.2em'
                }}>
                  STAGE
                </p>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#c4b5fd',
                fontStyle: 'italic'
              }}>
                ↑ Best view from center ↑
              </div>
            </div>

            {/* Seat Grid */}
            <div className="seat-grid-container" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '32px',
              padding: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '16px',
              width: '100%',
              overflowX: 'auto',
              overflowY: 'visible'
            }}>
              {rowLetters.map((row) => (
                <div
                  key={row}
                  className="seat-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    justifyContent: 'center',
                    minWidth: 'fit-content'
                  }}
                >
                  <span style={{
                    width: '30px',
                    minWidth: '30px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#c4b5fd',
                    fontSize: '16px',
                    flexShrink: '0'
                  }}>
                    {row}
                  </span>
                  
                  <div className="seat-row-container" style={{ 
                    display: 'flex', 
                    gap: '8px',
                    flexWrap: 'nowrap',
                    flexShrink: '0'
                  }}>
                    {Array.from({ length: seatsPerRow }, (_, seatIndex) => {
                      const seatNumber = seatIndex + 1;
                      const seatId = `${row}-${seatNumber}`;
                      const isBooked = bookedSeats.has(seatId);
                      const isSelected = selectedSeats.some(s => s.row === row && s.seatNumber === seatNumber);
                      
                      return (
                        <button
                          key={seatNumber}
                          className="seat-btn"
                          onClick={() => toggleSeat(row, seatNumber)}
                          disabled={isBooked}
                          title={isBooked ? 'Booked' : `Seat ${row}${seatNumber}`}
                          style={getSeatButtonStyle(isBooked, isSelected)}
                        >
                          {isSelected ? '✓' : seatNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  <span style={{
                    width: '30px',
                    minWidth: '30px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#c4b5fd',
                    fontSize: '16px',
                    flexShrink: '0'
                  }}>
                    {row}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: '2px solid rgba(147, 51, 234, 0.2)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#10b981',
                  borderRadius: '6px'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#e0e7ff' }}>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#9333ea',
                  borderRadius: '6px'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#e0e7ff' }}>Selected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#4b5563',
                  borderRadius: '6px',
                  opacity: '0.5'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#9ca3af' }}>Booked</span>
              </div>
            </div>

            {/* Selected Seats Summary */}
            {selectedSeats.length > 0 && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '2px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontWeight: 'bold',
                  color: '#e9d5ff',
                  marginBottom: '12px',
                  fontSize: '18px',
                  marginTop: '0'
                }}>
                  Your Selection
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {selectedSeats.map((seat, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      {seat.row}{seat.seatNumber}
                    </span>
                  ))}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '2px solid rgba(168, 85, 247, 0.2)'
                }}>
                  <span style={{ color: '#e9d5ff', fontWeight: '600', fontSize: '14px' }}>
                    {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{
                    color: '#e9d5ff',
                    fontWeight: 'bold',
                    fontSize: '24px'
                  }}>
                    ₹{(event?.price || 0) * selectedSeats.length}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#374151',
                  color: '#e5e7eb',
                  borderRadius: '10px',
                  border: '2px solid #4b5563',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedSeats.length === 0}
                style={{
                  padding: '12px 32px',
                  background: selectedSeats.length === 0 
                    ? '#4b5563' 
                    : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  boxShadow: selectedSeats.length === 0 
                    ? 'none' 
                    : '0 8px 20px -5px rgba(147, 51, 234, 0.6)',
                  opacity: selectedSeats.length === 0 ? '0.5' : '1'
                }}
              >
                Continue ({selectedSeats.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SeatSelection;