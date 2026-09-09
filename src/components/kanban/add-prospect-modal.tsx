'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Platform, PriorityLevel, Prospect, TeamMember } from '@/lib/types';
import { PLATFORM_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';

// Using a fallback for CATEGORY_SUGGESTIONS in case it's missing in constants
const CATEGORY_SUGGESTIONS = [
  'Restaurant', 'Cafe', 'Retail', 'Service', 'Software', 'Real Estate', 'Healthcare', 'Education'
];

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  team: TeamMember[];
  onSuccess: (prospect: Prospect) => void;
}

export function AddProspectModal({ isOpen, onClose, orgId, team, onSuccess }: AddProspectModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    platform: 'Instagram' as Platform,
    profile_link: '',
    category: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    assigned_to: '',
    priority: 'Medium' as PriorityLevel,
    expected_revenue: '',
  });

  const [showContact, setShowContact] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        orgId,
        expected_revenue: formData.expected_revenue ? parseFloat(formData.expected_revenue) : 0,
        assigned_to: formData.assigned_to || null,
      };

      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create lead');
      
      const newProspect = await res.json();
      toast.success('Lead created successfully');
      onSuccess(newProspect);
      onClose();
    } catch (error) {
      toast.error('Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Add New Lead</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Business Name *</label>
            <input 
              required
              type="text"
              value={formData.business_name}
              onChange={e => setFormData({...formData, business_name: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. The local cafe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Platform</label>
              <select
                value={formData.platform}
                onChange={e => setFormData({...formData, platform: e.target.value as Platform})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as PriorityLevel})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Profile/Website Link</label>
            <input 
              type="url"
              value={formData.profile_link}
              onChange={e => setFormData({...formData, profile_link: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <input 
                  type="text"
                  list="categories"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Restaurant"
                />
                <datalist id="categories">
                    {CATEGORY_SUGGESTIONS.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Expected Revenue (₹)</label>
                <input 
                  type="number"
                  min="0"
                  step="1"
                  value={formData.expected_revenue}
                  onChange={e => setFormData({...formData, expected_revenue: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="35000"
                />
              </div>
          </div>

          <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {team.map(member => (
                    <option key={member.user_id} value={member.user_id}>
                        {member.display_name || member.user_id}
                    </option>
                ))}
              </select>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
                type="button"
                onClick={() => setShowContact(!showContact)}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
                {showContact ? 'Hide' : 'Add'} Contact Info (Optional)
            </button>
          </div>

          {showContact && (
              <div className="space-y-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Contact Name</label>
                    <input 
                      type="text"
                      value={formData.contact_name}
                      onChange={e => setFormData({...formData, contact_name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                        <input 
                          type="tel"
                          value={formData.contact_phone}
                          onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input 
                          type="email"
                          value={formData.contact_email}
                          onChange={e => setFormData({...formData, contact_email: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                  </div>
              </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
