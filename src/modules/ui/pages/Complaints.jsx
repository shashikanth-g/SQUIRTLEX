// Complaints.jsx — Citizen complaint management and AI analysis
import React, { useState, useEffect } from 'react';
import { supabase } from '@sim/lib/supabaseClient';
import { useSimulation } from '@sim/context/SimulationContext.jsx';
import { MessageSquare, Zap, Plus, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Complaints() {
  const { autoFixEngine } = useSimulation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [formData, setFormData] = useState({
    user_name: '',
    location: '',
    issue_type: 'LEAK',
    description: ''
  });

  // Part 5: Fetch complaints from Supabase
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err) {
      console.warn('[COMPLAINTS]', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Part 10: Real-time subscription to complaints
  useEffect(() => {
    fetchComplaints();

    const channel = supabase
      .channel('complaints_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        () => fetchComplaints()
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  // Part 7: Map complaint to issue type and call AutoFix
  const handleAnalyzeComplaint = async (complaint) => {
    setAnalyzing(complaint.id);
    try {
      const issueTypeMap = {
        'LEAK': 'LEAK',
        'PRESSURE': 'LOW_PRESSURE',
        'CONTAMINATION': 'CONTAMINATION',
        'SEWAGE': 'SEWAGE_INFLOW',
        'SERVICE': 'SERVICE_DISRUPTION'
      };

      const mappedType = issueTypeMap[complaint.issue_type] || 'SYSTEM_ALERT';

      if (autoFixEngine) {
        const action = autoFixEngine.processTick([{
          type: mappedType,
          severity: 'high',
          location: complaint.location,
          description: complaint.description,
          sourceId: complaint.id
        }]);

        // Part 9: Generate AI response after fix
        const responses = {
          'LEAK': 'Leak detected and repair crew dispatched to the location.',
          'LOW_PRESSURE': 'Pressure issue identified. Valve adjustments queued for optimization.',
          'CONTAMINATION': 'Contamination detected. Water treatment initiated immediately.',
          'SEWAGE_INFLOW': 'Sewage inflow detected. Isolation and treatment procedures activated.',
          'SERVICE_DISRUPTION': 'Service disruption reported. Emergency response team notified.'
        };

        const aiResponse = responses[mappedType] || 'Issue analyzed and scheduled for resolution.';

        // Part 8: Update status after analysis
        await updateComplaintStatus(complaint.id, 'in_progress', aiResponse);
      }
    } catch (err) {
      console.warn('[COMPLAINT ANALYSIS]', err.message);
    } finally {
      setAnalyzing(null);
    }
  };

  // Part 8: Update complaint status
  const updateComplaintStatus = async (complaintId, status, aiResponse = '') => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status,
          ai_response: aiResponse || undefined
        })
        .eq('id', complaintId);

      if (error) throw error;
      fetchComplaints();

      // Part 12: Auto-resolve after 5 seconds (simulate fix completion)
      if (status === 'in_progress') {
        setTimeout(() => {
          updateComplaintStatus(complaintId, 'resolved');
        }, 5000);
      }
    } catch (err) {
      console.warn('[UPDATE COMPLAINT]', err.message);
    }
  };

  // Part 11: Handle form submission
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('complaints')
        .insert([{
          user_name: formData.user_name,
          location: formData.location,
          issue_type: formData.issue_type,
          description: formData.description,
          status: 'pending'
        }]);

      if (error) throw error;

      setFormData({ user_name: '', location: '', issue_type: 'LEAK', description: '' });
      setShowForm(false);
      fetchComplaints();
    } catch (err) {
      console.warn('[SUBMIT COMPLAINT]', err.message);
    }
  };

  // Part 12: Status color coding
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFD93D'; // yellow
      case 'in_progress': return '#6B9FFF'; // blue
      case 'resolved': return '#6BCF7F'; // green
      default: return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'in_progress': return <Loader2 size={16} className="animate-spin" />;
      case 'resolved': return <CheckCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="page complaints-page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <MessageSquare size={28} className="text-primary" />
          <div>
            <h2>Citizen Complaints</h2>
            <span className="page-subtitle">Manage and analyze public issue reports</span>
          </div>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          New Complaint
        </button>
      </div>

      {/* Part 11: Complaint submission form */}
      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                className="input"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                required
              />
            </div>
            <select
              value={formData.issue_type}
              onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
              className="input w-full"
            >
              <option value="LEAK">Leak</option>
              <option value="PRESSURE">Pressure Issue</option>
              <option value="CONTAMINATION">Water Contamination</option>
              <option value="SEWAGE">Sewage Inflow</option>
              <option value="SERVICE">Service Disruption</option>
            </select>
            <textarea
              placeholder="Describe the issue in detail"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-24"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1">
                Submit Report
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex flex-col items-center gap-2">
          <span className="text-2xl font-bold text-primary">{complaints.length}</span>
          <span className="text-sm text-secondary">Total Reports</span>
        </div>
        <div className="card p-4 flex flex-col items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: '#FFD93D' }}>
            {complaints.filter(c => c.status === 'pending').length}
          </span>
          <span className="text-sm text-secondary">Pending</span>
        </div>
        <div className="card p-4 flex flex-col items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: '#6B9FFF' }}>
            {complaints.filter(c => c.status === 'in_progress').length}
          </span>
          <span className="text-sm text-secondary">In Progress</span>
        </div>
        <div className="card p-4 flex flex-col items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: '#6BCF7F' }}>
            {complaints.filter(c => c.status === 'resolved').length}
          </span>
          <span className="text-sm text-secondary">Resolved</span>
        </div>
      </div>

      {/* Part 6: Complaints list with action buttons */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
            <p>No complaints yet. The system is operating normally.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-secondary/20">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-secondary">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary">Issue Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary">AI Response</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="border-b border-secondary/10 hover:bg-secondary/5 transition-colors"
                  >
                    <td className="py-3 px-4">{complaint.user_name}</td>
                    <td className="py-3 px-4 text-primary">{complaint.location}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-primary">{complaint.issue_type}</span>
                    </td>
                    <td className="py-3 px-4 text-secondary max-w-xs truncate">
                      {complaint.description}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2" style={{ color: getStatusColor(complaint.status) }}>
                        {getStatusIcon(complaint.status)}
                        <span className="capitalize text-xs font-semibold">{complaint.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-secondary max-w-xs truncate">
                      {complaint.ai_response || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {complaint.status === 'pending' && (
                        <button
                          className="btn btn-sm btn-primary flex items-center gap-1"
                          onClick={() => handleAnalyzeComplaint(complaint)}
                          disabled={analyzing === complaint.id}
                        >
                          {analyzing === complaint.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Zap size={14} />
                          )}
                          Analyze
                        </button>
                      )}
                      {complaint.status === 'in_progress' && (
                        <span className="text-xs text-secondary">Processing...</span>
                      )}
                      {complaint.status === 'resolved' && (
                        <span className="text-xs text-primary font-semibold">✓ Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
