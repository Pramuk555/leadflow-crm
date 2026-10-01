'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  onAddProspect?: () => void;
}

export function Header({ title, onAddProspect }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 glass border-b border-slate-800">
      <div className="flex min-w-0 items-center">
        <h1 className="truncate text-lg font-semibold text-slate-100 sm:text-xl">{title}</h1>
      </div>
      
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search prospects..."
            className="h-9 w-64 rounded-md bg-slate-900 border border-slate-700 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
        
        {onAddProspect && (
          <button
            onClick={onAddProspect}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Prospect</span>
          </button>
        )}
      </div>
    </header>
  );
}
