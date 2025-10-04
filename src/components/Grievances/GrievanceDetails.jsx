import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  X,
  Calendar,
  User,
  Building2,
  AlertCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function GrievanceDetails({ grievance, onClose, onUpdate }) {
  const { profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(grievance.status);
  const [resolution, setResolution] = useState(grievance.resolution || '');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'hr';
  const isOwner = grievance.employee_id === profile?.id;

  useEffect(() => {
    fetchComments();
  }, [grievance.id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('grievance_comments')
        .select('*, profiles(full_name, role)')
        .eq('grievance_id', grievance.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('grievance_comments').insert([
        {
          grievance_id: grievance.id,
          user_id: profile.id,
          comment: newComment,
          is_internal: false,
        },
      ]);

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
      };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolution = resolution;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('grievances')
        .update(updateData)
        .eq('id', grievance.id);

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-amber-100 text-amber-800 border-amber-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      investigating: 'bg-purple-100 text-purple-800 border-purple-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return colors[priority] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{grievance.title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(grievance.status)}`}>
                  {grievance.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(grievance.priority)}`}>
                  {grievance.priority.toUpperCase()} PRIORITY
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                  {grievance.category.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {isAdmin && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <User className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-xs text-slate-500">Employee</p>
                  <p className="text-sm font-semibold text-slate-900">{grievance.profiles?.full_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Building2 className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Department</p>
                <p className="text-sm font-semibold text-slate-900">{grievance.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Submitted</p>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(grievance.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Description</h3>
            <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">{grievance.description}</p>
          </div>

          {grievance.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">Resolution</h3>
              </div>
              <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">{grievance.resolution}</p>
            </div>
          )}

          {isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Admin Actions</h3>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {(newStatus === 'resolved' || newStatus === 'closed') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resolution Details
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Provide details about the resolution..."
                  ></textarea>
                </div>
              )}

              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Grievance'}
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-bold text-slate-900">Comments & Updates</h3>
              <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full">
                {comments.length}
              </span>
            </div>

            <div className="space-y-4 mb-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No comments yet</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-semibold">
                          {comment.profiles?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {comment.profiles?.full_name}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">{comment.profiles?.role}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-900 text-sm leading-relaxed">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
