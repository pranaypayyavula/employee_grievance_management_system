import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Filter,
  Search,
  Eye,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';

export default function GrievanceList({ onCreateNew, onViewDetails }) {
  const { profile } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'hr';

  useEffect(() => {
    fetchGrievances();
  }, [profile]);

  useEffect(() => {
    filterGrievances();
  }, [grievances, searchTerm, statusFilter, priorityFilter]);

  const fetchGrievances = async () => {
    try {
      let query = supabase
        .from('grievances')
        .select('*, profiles!grievances_employee_id_fkey(full_name, employee_id, department)')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('employee_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setGrievances(data || []);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGrievances = () => {
    let filtered = [...grievances];

    if (searchTerm) {
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((g) => g.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((g) => g.priority === priorityFilter);
    }

    setFilteredGrievances(filtered);
  };

  const getStatusIcon = (status) => {
    const icons = {
      submitted: Clock,
      under_review: AlertCircle,
      investigating: AlertCircle,
      resolved: CheckCircle2,
      closed: XCircle,
    };
    return icons[status] || Clock;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            {isAdmin ? 'All Grievances' : 'My Grievances'}
          </h2>
          <p className="text-slate-600 mt-1">
            {filteredGrievances.length} {filteredGrievances.length === 1 ? 'grievance' : 'grievances'} found
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            New Grievance
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search grievances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {filteredGrievances.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No grievances found</h3>
          <p className="text-slate-600">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Submit your first grievance to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGrievances.map((grievance) => {
            const StatusIcon = getStatusIcon(grievance.status);
            return (
              <div
                key={grievance.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 flex-1">
                      {grievance.title}
                    </h3>
                  </div>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {grievance.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(grievance.status)}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {grievance.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(grievance.priority)}`}>
                      {grievance.priority.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {grievance.category.replace('_', ' ')}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-200">
                      <User className="w-4 h-4" />
                      <span>{grievance.profiles?.full_name}</span>
                      <span className="text-slate-400">•</span>
                      <span>{grievance.profiles?.department}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(grievance.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>

                    <button
                      onClick={() => onViewDetails(grievance)}
                      className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium text-sm group-hover:gap-3 transition-all"
                    >
                      View Details
                      <Eye className="w-4 h-4" />
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
}
