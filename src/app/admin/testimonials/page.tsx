'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  photo: string;
  quote: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const supabase = createClient();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_approved: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
    }
  };

  const filtered = testimonials.filter(t => {
    if (filter === 'pending') return !t.is_approved;
    if (filter === 'approved') return t.is_approved;
    return true;
  });

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
    ));

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
          <h1 className="text-4xl font-serif font-bold">Testimonials</h1>
          <p className="text-muted-foreground mt-2">Manage and approve customer testimonials</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
            <Icon name="StarIcon" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No testimonials found</p>
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              t.is_approved ? 'border-green-500' : 'border-yellow-500'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {t.photo ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <AppImage src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="UserIcon" className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                    <div className="flex text-sm">{renderStars(t.rating)}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  t.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {t.is_approved ? 'Approved' : 'Pending'}
                </span>
              </div>

              <p className="text-sm text-muted-foreground italic mb-4 line-clamp-3">"{t.quote}"</p>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleApproval(t.id, t.is_approved)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    t.is_approved
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {t.is_approved ? 'Unapprove' : 'Approve'}
                </button>
                <button
                  onClick={() => deleteTestimonial(t.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  <Icon name="TrashIcon" className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
