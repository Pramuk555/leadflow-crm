import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { STATUS_CONFIG, PLATFORM_CONFIG } from '@/lib/constants';
import { cookies } from 'next/headers';
import { MOCK_PROSPECTS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, Trophy, DollarSign, TrendingUp, Users, Target } from 'lucide-react';

export default async function StatsPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('leadflow_demo')?.value === 'true';

  let allProspects = MOCK_PROSPECTS;

  if (!isDemo) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: member } = await supabase
      .from('team_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (member) {
      const { data: prospects } = await supabase
        .from('prospects')
        .select('*')
        .eq('org_id', member.org_id);
      if (prospects && prospects.length > 0) {
        allProspects = prospects;
      }
    }
  }

  const totalLeads = allProspects.length;

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  let totalPipelineRevenue = 0;
  let wonRevenue = 0;

  Object.keys(STATUS_CONFIG).forEach((status) => {
    statusCounts[status] = 0;
  });

  allProspects.forEach((p) => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status]++;
    }
    const rev = Number(p.expected_revenue) || 0;
    totalPipelineRevenue += rev;
    if (p.status === 'won') {
      wonRevenue += rev;
    }
  });

  const wonCount = statusCounts['won'] || 0;
  const conversionRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : '0';

  // Platform breakdown
  const platformCounts: Record<string, number> = {
    instagram: 0,
    facebook: 0,
    google_maps: 0,
    other: 0,
  };
  allProspects.forEach((p) => {
    if (platformCounts[p.platform] !== undefined) {
      platformCounts[p.platform]++;
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Agency Analytics & Performance</h1>
        <p className="text-sm text-slate-400">High-level pipeline metrics, conversion funnel, and lead sources.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Prospects</span>
            <span className="text-2xl font-bold text-slate-100">{totalLeads}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Closed Won</span>
            <span className="text-2xl font-bold text-emerald-400">{wonCount}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Win Conversion Rate</span>
            <span className="text-2xl font-bold text-violet-300">{conversionRate}%</span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Won Revenue</span>
            <span className="text-2xl font-bold text-amber-300">{formatCurrency(wonRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Pipeline Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" /> Pipeline Stage Breakdown
          </h2>

          <div className="space-y-4">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const count = statusCounts[key] || 0;
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span>{config.icon}</span> {config.label}
                    </span>
                    <span className="text-slate-400">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-950/60 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${config.bgColor.replace('/10', '/80')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Breakdown */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-400" /> Lead Source / Platform Channels
          </h2>

          <div className="space-y-4">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const count = platformCounts[key] || 0;
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span>{config.icon}</span> {config.label}
                    </span>
                    <span className="text-slate-400">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-950/60 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
