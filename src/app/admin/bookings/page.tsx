'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service_type: string;
  event_date: string;
  event_location: string;
  message: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Booking>>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchBookings();
  }, [filter, serviceTypeFilter, dateRange]);

  const fetchBookings = async () => {
    try {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (serviceTypeFilter !== 'all') {
        query = query.eq('service_type', serviceTypeFilter);
      }

      if (dateRange.start) {
        query = query.gte('event_date', dateRange.start);
      }

      if (dateRange.end) {
        query = query.lte('event_date', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings by search query (client-side)
  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    let query = searchQuery.toLowerCase();
    return (
      booking.name.toLowerCase().includes(query) ||
      booking.email.toLowerCase().includes(query) ||
      booking.phone.includes(query) ||
      booking.service_type.toLowerCase().includes(query) ||
      booking.event_location.toLowerCase().includes(query)
    );
  });

  const sendBookingEmail = async (booking: Booking, emailType: string) => {
    setSendingEmail(booking.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-booking-email', {
        body: {
          type: emailType,
          booking: booking
        }
      });

      if (error) throw error;
      alert(`${emailType.charAt(0).toUpperCase() + emailType.slice(1)} email sent successfully!`);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(null);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      // Send status update email
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        const updatedBooking = { ...booking, status: status as any };
        
        // Send appropriate email based on status
        if (status === 'confirmed') {
          await sendBookingEmail(updatedBooking, 'confirmation');
        } else if (status === 'cancelled') {
          await sendBookingEmail(updatedBooking, 'cancellation');
        } else {
          await sendBookingEmail(updatedBooking, 'status_update');
        }
      }
      
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleEditClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditFormData({
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      service_type: booking.service_type,
      event_date: booking.event_date,
      event_location: booking.event_location,
      message: booking.message,
      status: booking.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update(editFormData)
        .eq('id', selectedBooking.id);

      if (error) throw error;

      alert('Booking updated successfully!');
      setShowEditModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking. Please try again.');
    }
  };

  const handleDeleteClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', selectedBooking.id);

      if (error) throw error;

      alert('Booking deleted successfully!');
      setShowDeleteModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking. Please try again.');
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      await sendBookingEmail(selectedBooking, 'cancellation');
      alert('Booking cancelled successfully!');
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancellationReason('');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setServiceTypeFilter('all');
    setDateRange({ start: '', end: '' });
    setFilter('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">Manage all booking requests</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Icon name="MagnifyingGlassIcon" className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone, service, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Service Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">Service Type</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 text-sm sm:text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Services</option>
              <option value="music">Music Show</option>
              <option value="animation">Animation Project</option>
              <option value="comedy">Comedy Show</option>
              <option value="coaching">Comedy Coaching</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-2 text-sm sm:text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-2 text-sm sm:text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="XMarkIcon" className="w-5 h-5" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 sm:space-x-2 sm:gap-0 border-b border-muted-foreground/20 overflow-x-auto">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 sm:px-4 py-2 font-medium capitalize transition-colors text-sm whitespace-nowrap ${
              filter === status
                ? 'border-b-2 border-primary text-primary' :'text-muted-foreground hover:text-primary'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredBookings.length} of {bookings.length} bookings
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Icon name="CalendarIcon" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold truncate">{booking.name}</h3>
                  <p className="text-muted-foreground text-sm break-all">{booking.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium capitalize whitespace-nowrap ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div className="flex items-center space-x-2 min-w-0">
                  <Icon name="PhoneIcon" className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{booking.phone}</span>
                </div>
                <div className="flex items-center space-x-2 min-w-0">
                  <Icon name="BriefcaseIcon" className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{booking.service_type}</span>
                </div>
                <div className="flex items-center space-x-2 min-w-0">
                  <Icon name="CalendarIcon" className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{new Date(booking.event_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 min-w-0">
                  <Icon name="MapPinIcon" className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{booking.event_location}</span>
                </div>
              </div>

              {booking.message && (
                <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-xs sm:text-sm break-words">{booking.message}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleEditClick(booking)}
                  className="px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-xs sm:text-sm whitespace-nowrap flex items-center gap-2"
                >
                  <Icon name="PencilIcon" className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(booking)}
                  className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs sm:text-sm whitespace-nowrap flex items-center gap-2"
                >
                  <Icon name="TrashIcon" className="w-4 h-4" />
                  Delete
                </button>
                {booking.status !== 'confirmed' && (
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                    disabled={sendingEmail === booking.id}
                    className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {sendingEmail === booking.id ? 'Sending...' : 'Confirm'}
                  </button>
                )}
                {booking.status !== 'completed' && (
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'completed')}
                    disabled={sendingEmail === booking.id}
                    className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {sendingEmail === booking.id ? 'Sending...' : 'Complete'}
                  </button>
                )}
                {booking.status !== 'cancelled' && (
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                    disabled={sendingEmail === booking.id}
                    className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {sendingEmail === booking.id ? 'Sending...' : 'Cancel'}
                  </button>
                )}
                <button
                  onClick={() => sendBookingEmail(booking, 'reminder')}
                  disabled={sendingEmail === booking.id}
                  className="px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {sendingEmail === booking.id ? 'Sending...' : 'Send Reminder'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Booking</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <Icon name="XMarkIcon" className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Type</label>
                <input
                  type="text"
                  value={editFormData.service_type || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, service_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Event Date</label>
                <input
                  type="date"
                  value={editFormData.event_date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, event_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Event Location</label>
                <input
                  type="text"
                  value={editFormData.event_location || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, event_location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={editFormData.message || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editFormData.status || 'pending'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditSubmit}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Icon name="ExclamationTriangleIcon" className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold">Delete Booking</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the booking for <strong>{selectedBooking.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Cancel Booking</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancellationReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="x-mark" className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this booking for <strong>{selectedBooking?.name}</strong>?
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason (will be sent to client)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancellationReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}