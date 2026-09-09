'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BarChart3, Settings, Sparkles, LogOut, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SidebarProps {
  user: {
    name: string;
    email: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error: any) {
      toast.error('Failed to logout');
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Stats', href: '/stats', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 ease-in-out h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
        <Sparkles className="h-6 w-6 text-blue-500 shrink-0" />
        {!collapsed && (
          <span className="ml-3 font-semibold text-lg bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent truncate">
            LeadFlow
          </span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                'flex items-center px-2 py-2 rounded-md transition-colors group',
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              )}
              title={collapsed ? link.name : undefined}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300')} />
              {!collapsed && <span className="ml-3 truncate">{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            {!collapsed && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="ml-2 p-1.5 rounded-md text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
