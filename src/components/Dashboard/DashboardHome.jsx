import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';

export default function DashboardHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    under_review: 0,
    resolved: 0,
  });
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'hr';

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      let query = supabase.from('grievances').select('*');

      if (!isAdmin) {
        query = query.eq('employee_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const total = data.length;
      const submitted = data.filter((g) => g.status === 'submitted').length;
      const under_review = data.filter((g) => g.status === 'under_review' || g.status === 'investigating').length;
      const resolved = data.filter((g) => g.status === 'resolved' || g.status === 'closed').length;

      setStats({ total, submitted, under_review, resolved });
      setRecentGrievances(data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Grievances',
      value: stats.total,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Submitted',
      value: stats.submitted,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Under Review',
      value: stats.under_review,
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-amber-100 text-amber-800',
      under_review: 'bg-blue-100 text-blue-800',
      investigating: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-slate-100 text-slate-800',
    };
    return colors[priority] || 'bg-slate-100 text-slate-800';
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
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {profile?.full_name}!
        </h2>
        <p className="text-slate-600">
          {isAdmin ? 'Manage and oversee all employee grievances' : 'Track and manage your grievances'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Recent Grievances</h3>
          <p className="text-sm text-slate-600">Latest submissions and updates</p>
        </div>

        {recentGrievances.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-1">No grievances yet</p>
            <p className="text-sm text-slate-500">
              {isAdmin ? 'No grievances have been submitted' : 'Submit your first grievance to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {recentGrievances.map((grievance) => (
              <div key={grievance.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{grievance.title}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2">{grievance.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(grievance.status)}`}>
                    {grievance.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(grievance.priority)}`}>
                    {grievance.priority.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {grievance.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500 ml-auto">
                    {new Date(grievance.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Need to report an issue?</h3>
              <p className="text-slate-300 mb-4">
                Your voice matters. Submit a grievance and we'll work together to resolve it.
              </p>
              <button className="bg-white text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-colors">
                Submit New Grievance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
