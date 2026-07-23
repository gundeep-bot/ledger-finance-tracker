import React from 'react';
import { CheckCircle, Calendar, MapPin, Ticket, CreditCard, Mail, Download, Home } from 'lucide-react';

const BookingConfirmation = ({ booking, onBackToHome }) => {
  if (!booking || !booking.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No booking information available</p>
          <button
            onClick={onBackToHome}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const bookingData = booking.data;
  const event = bookingData.event;
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownload = async () => {
    // Load jsPDF from CDN if not already loaded
    if (!window.jspdf) {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
          generatePDF();
          resolve();
        };
        document.head.appendChild(script);
      });
    } else {
      generatePDF();
    }

    function generatePDF() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Set up colors
      const purple = [147, 51, 234];
      const pink = [236, 72, 153];
      
      // Header with gradient effect
      doc.setFillColor(...purple);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('BOOKING CONFIRMATION', 105, 20, { align: 'center' });
      
      // Booking Reference
      doc.setFontSize(10);
      doc.text(`Reference: ${bookingData.bookingReference || 'N/A'}`, 105, 30, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      let yPos = 50;
      
      // Event Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(event.title, 20, yPos);
      yPos += 10;
      
      // Event Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      doc.text(`Date: ${formattedDate}`, 20, yPos);
      yPos += 7;
      doc.text(`Time: ${event.time || '18:00'}`, 20, yPos);
      yPos += 7;
      doc.text(`Venue: ${event.venue}`, 20, yPos);
      yPos += 7;
      doc.text(`Location: ${event.location}`, 20, yPos);
      yPos += 10;
      
      // Ticket Details
      doc.setFont('helvetica', 'bold');
      doc.text('Ticket Details:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(`Number of Tickets: ${bookingData.numberOfTickets}`, 20, yPos);
      yPos += 7;
      
      if (bookingData.selectedSeats && bookingData.selectedSeats.length > 0) {
        const seatsText = bookingData.selectedSeats.map(s => `${s.row}${s.seatNumber}`).join(', ');
        doc.text(`Seats: ${seatsText}`, 20, yPos);
        yPos += 7;
      }
      
      yPos += 5;
      
      // Payment Details
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Details:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment Method: ${bookingData.paymentMethod || 'Card'}`, 20, yPos);
      yPos += 7;
      doc.text(`Payment Status: ${bookingData.paymentStatus === 'paid' ? 'Paid' : 'Pending'}`, 20, yPos);
      yPos += 10;
      
      // Total Amount (highlighted)
      doc.setFillColor(...purple);
      doc.rect(20, yPos - 5, 170, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`Total Amount: ₹${bookingData.totalPrice}`, 105, yPos + 5, { align: 'center' });
      yPos += 15;
      
      // Footer
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      doc.text('Important Information:', 20, yPos);
      yPos += 7;
      doc.setFontSize(9);
      doc.text('• Please arrive at least 15 minutes before the event starts', 25, yPos);
      yPos += 5;
      doc.text('• Bring a valid ID and this booking confirmation', 25, yPos);
      yPos += 5;
      doc.text('• Keep your booking reference number handy', 25, yPos);
      yPos += 5;
      doc.text('• For questions, contact support@eventora.com', 25, yPos);
      
      // Thank you message
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...purple);
      doc.text('Thank you for your booking!', 105, yPos, { align: 'center' });
      
      // Save the PDF
      doc.save(`booking-${bookingData.bookingReference || 'confirmation'}.pdf`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <CheckCircle className="text-white" size={48} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your tickets have been booked successfully</p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                <p className="text-purple-100">Booking Reference: {bookingData.bookingReference || 'N/A'}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <p className="text-sm text-purple-100">Status</p>
                <p className="text-lg font-bold">
                  {bookingData.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Event Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Calendar className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                  <p className="font-semibold text-gray-900">{formattedDate}</p>
                  <p className="text-gray-700">{event.time || '18:00'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-pink-100 rounded-lg p-3">
                  <MapPin className="text-pink-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Venue</p>
                  <p className="font-semibold text-gray-900">{event.venue}</p>
                  <p className="text-gray-700">{event.location}</p>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <Ticket className="text-green-600" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Ticket Details</p>
                  <p className="font-semibold text-gray-900 mb-2">
                    {bookingData.numberOfTickets} Ticket{bookingData.numberOfTickets > 1 ? 's' : ''}
                  </p>
                  {bookingData.selectedSeats && bookingData.selectedSeats.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bookingData.selectedSeats.map((seat, index) => (
                        <span
                          key={index}
                          className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
                        >
                          {seat.row}{seat.seatNumber}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <CreditCard className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Payment Details</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Total Amount</p>
                      <p className="text-sm text-gray-600">Payment Method: {bookingData.paymentMethod || 'Card'}</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">₹{bookingData.totalPrice}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Notification */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-1">Confirmation Email Sent</p>
                  <p className="text-xs text-green-700">
                    A confirmation email has been sent to your registered email address with all booking details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-yellow-900 mb-3">Important Information</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• Please arrive at least 15 minutes before the event starts</li>
            <li>• Bring a valid ID and this booking confirmation</li>
            <li>• Keep your booking reference number handy: <strong>{bookingData.bookingReference}</strong></li>
            <li>• If you have any questions, contact us at support@eventora.com</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition flex items-center justify-center space-x-2"
          >
            <Download size={20} />
            <span>Download PDF Ticket</span>
          </button>
          <button
            onClick={onBackToHome}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center space-x-2"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

