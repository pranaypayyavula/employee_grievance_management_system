import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalGrievances: 0,
    byStatus: {},
    byCategory: {},
    byPriority: {},
    byDepartment: {},
    avgResolutionTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.from('grievances').select('*');

      if (error) throw error;

      const byStatus = {};
      const byCategory = {};
      const byPriority = {};
      const byDepartment = {};
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      data.forEach((g) => {
        byStatus[g.status] = (byStatus[g.status] || 0) + 1;
        byCategory[g.category] = (byCategory[g.category] || 0) + 1;
        byPriority[g.priority] = (byPriority[g.priority] || 0) + 1;
        byDepartment[g.department] = (byDepartment[g.department] || 0) + 1;

        if (g.resolved_at) {
          const created = new Date(g.created_at);
          const resolved = new Date(g.resolved_at);
          const days = (resolved - created) / (1000 * 60 * 60 * 24);
          totalResolutionTime += days;
          resolvedCount++;
        }
      });

      setStats({
        totalGrievances: data.length,
        byStatus,
        byCategory,
        byPriority,
        byDepartment,
        avgResolutionTime: resolvedCount > 0 ? (totalResolutionTime / resolvedCount).toFixed(1) : 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPercentage = (status) => {
    if (stats.totalGrievances === 0) return 0;
    return ((stats.byStatus[status] || 0) / stats.totalGrievances * 100).toFixed(1);
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
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h2>
        <p className="text-slate-600">Overview of all grievance data and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-blue-100 text-sm font-medium mb-1">Total Grievances</p>
          <p className="text-4xl font-bold">{stats.totalGrievances}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-amber-100 text-sm font-medium mb-1">Pending Review</p>
          <p className="text-4xl font-bold">{stats.byStatus['submitted'] || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-purple-100 text-sm font-medium mb-1">In Progress</p>
          <p className="text-4xl font-bold">
            {(stats.byStatus['under_review'] || 0) + (stats.byStatus['investigating'] || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-green-100 text-sm font-medium mb-1">Resolved</p>
          <p className="text-4xl font-bold">
            {(stats.byStatus['resolved'] || 0) + (stats.byStatus['closed'] || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-bold text-slate-900">Status Distribution</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 capitalize">
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {count} ({getStatusPercentage(status)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-slate-600 to-slate-800 h-full rounded-full transition-all"
                    style={{ width: `${getStatusPercentage(status)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-bold text-slate-900">Priority Levels</h3>
          </div>

          <div className="space-y-3">
            {['critical', 'high', 'medium', 'low'].map((priority) => {
              const count = stats.byPriority[priority] || 0;
              const percentage = stats.totalGrievances > 0 ? (count / stats.totalGrievances * 100).toFixed(1) : 0;
              const colors = {
                critical: 'bg-red-500',
                high: 'bg-orange-500',
                medium: 'bg-yellow-500',
                low: 'bg-slate-500',
              };
              return (
                <div key={priority} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 capitalize">{priority}</span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${colors[priority]} h-full rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-1">Avg. Resolution Time</p>
              <p className="text-3xl font-bold text-slate-900">{stats.avgResolutionTime} days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900">Grievances by Category</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats.byCategory).map(([category, count]) => (
            <div key={category} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm font-medium text-slate-600 mb-2 capitalize">
                {category.replace('_', ' ')}
              </p>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900">Department Breakdown</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.byDepartment).map(([department, count]) => (
            <div key={department} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm font-medium text-slate-600 mb-2">{department}</p>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 mt-1">
                {((count / stats.totalGrievances) * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
