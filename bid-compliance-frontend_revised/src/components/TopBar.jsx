import React from 'react';
import { Landmark } from 'lucide-react';

export default function TopBar({ subtitle, right }) {
  return (
    <header className="shrink-0">
      <div className="h-1.5 flex">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white border-y border-line" />
        <div className="flex-1 bg-india-green" />
      </div>
      <div className="bg-brand text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-white/10 rounded-md shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-tight truncate">बोली अनुपालन जांच · Bid Compliance Checker</p>
            {subtitle && <p className="text-xs text-white/70 leading-tight truncate">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  );
}
