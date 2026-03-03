'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  const supabase = createClient();

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && contacts.length > 0) {
      const match = contacts.find((c) => c.id === idParam);
      if (match) setSelectedContact(match);
    }
  }, [contacts, searchParams]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const { error } = await supabase.from('contact_submissions').delete().eq('id', id);
      if (error) throw error;
      if (selectedContact?.id === id) setSelectedContact(null);
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-bold">Contact Messages</h1>
          <p className="text-muted-foreground mt-2">{contacts.length} message{contacts.length !== 1 ? 's' : ''} received</p>
        </div>
        <button
          onClick={fetchContacts}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
        >
          <Icon name="ArrowPathIcon" className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon name="MagnifyingGlassIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact List */}
        <div className="space-y-3">
          {filteredContacts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Icon name="EnvelopeIcon" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No contact messages found</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 ${
                  selectedContact?.id === contact.id ? 'border-primary' : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDate(contact.created_at)}
                  </span>
                </div>
                <p className="text-sm font-medium text-primary truncate">{contact.subject}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contact.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:sticky lg:top-6">
          {selectedContact ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Message Details</h2>
                <button
                  onClick={() => deleteContact(selectedContact.id)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                >
                  <Icon name="TrashIcon" className="w-4 h-4" />
                  Delete
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">From</p>
                    <p className="font-semibold">{selectedContact.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                    <p className="font-semibold text-sm">{formatDate(selectedContact.created_at)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {selectedContact.email}
                  </a>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
                  <p className="font-semibold">{selectedContact.subject}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Message</p>
                  <div className="bg-accent/10 rounded-lg p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={`mailto:${selectedContact.email}?subject=Re: ${encodeURIComponent(selectedContact.subject)}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Icon name="EnvelopeIcon" className="w-5 h-5" />
                    Reply via Email
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Icon name="EnvelopeOpenIcon" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
