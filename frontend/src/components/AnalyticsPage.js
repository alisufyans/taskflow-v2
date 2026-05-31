import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';
import { analyticsService } from '../services/api';

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981'];
const PRIO_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#64748b' };

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className={`stat-card-value ${color}`}>{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, tr] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getTrends(period),
      ]);
      setOverview(ov.data.data);
      setTrends(tr.data.data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tooltipStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '12px',
  };

  if (loading) return <div className="loader-wrap"><div className="loader" /></div>;

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Data-driven insights into your task performance</p>
      </div>

      {/* Overview Stats */}
      <div className="stats-row" style={{ marginBottom: '2rem' }}>
        <StatCard label="Total Tasks" value={overview?.total ?? 0} color="white" />
        <StatCard label="Completed" value={overview?.completed ?? 0} color="green" />
        <StatCard label="In Progress" value={overview?.inProgress ?? 0} color="blue" />
        <StatCard label="Pending" value={overview?.pending ?? 0} color="yellow" />
        <StatCard label="Overdue" value={overview?.overdue ?? 0} color="red" />
        <StatCard label="Completion Rate" value={`${overview?.completionRate ?? 0}%`} color="green" />
      </div>

      {/* Charts Grid */}
      <div className="analytics-grid">

        {/* Status Pie Chart */}
        <div className="chart-card">
          <div className="chart-title">Status Breakdown</div>
          {overview?.statusBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={overview.statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {overview.statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-desc">No task data yet</div>
            </div>
          )}
        </div>

        {/* Priority Bar Chart */}
        <div className="chart-card">
          <div className="chart-title">Priority Distribution</div>
          {overview?.priorityBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={overview.priorityBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {overview.priorityBreakdown.map((entry, i) => (
                    <Cell key={i} fill={PRIO_COLORS[entry.name] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-desc">No task data yet</div>
            </div>
          )}
        </div>

        {/* Trends Line Chart – full width */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="chart-title" style={{ marginBottom: 0 }}>Task Trends</div>
            <div className="period-toggle">
              <button className={`period-btn ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
              <button className={`period-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
            </div>
          </div>
          {trends?.labels?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={trends.labels.map((label, i) => ({
                  label,
                  Created: trends.created[i] || 0,
                  Completed: trends.completed[i] || 0,
                  Overdue: trends.overdue[i] || 0,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="Created" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Overdue" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No trend data yet</div>
              <div className="empty-state-desc">Create some tasks to see your trends</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
