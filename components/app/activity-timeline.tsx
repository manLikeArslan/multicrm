'use client';

import React from 'react';
import { Phone, Mail, Users, FileText, Trash2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Activity {
  activity_id: number;
  deal_id?: number;
  contact_id?: number;
  company_id: number;
  performed_by?: number;
  activity_type: 'call' | 'email' | 'meeting' | 'note';
  summary: string;
  activity_date: string;
  performer_name?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return (
          <div className="p-2 bg-[#6B8F71]/10 text-[#6B8F71] rounded-full border border-[#6B8F71]/20">
            <Phone className="h-4 w-4" />
          </div>
        );
      case 'email':
        return (
          <div className="p-2 bg-[#5B8FB9]/10 text-[#5B8FB9] rounded-full border border-[#5B8FB9]/20">
            <Mail className="h-4 w-4" />
          </div>
        );
      case 'meeting':
        return (
          <div className="p-2 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">
            <Users className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-slate-500/10 text-[#8A8680] rounded-full border border-slate-500/20">
            <FileText className="h-4 w-4" />
          </div>
        );
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#5A5853] text-xs gap-2">
        <Calendar className="h-8 w-8 opacity-30" />
        <span>No activities logged yet.</span>
      </div>
    );
  }

  return (
    <div className="flow-root relative pl-4 border-l border-[#2A2A2D] space-y-6">
      {activities.map((activity, index) => {
        const formattedDate = format(new Date(activity.activity_date), 'PPP p');
        return (
          <div key={activity.activity_id} className="relative group animate-fade-up">
            {/* Timeline Dot Icon */}
            <span className="absolute -left-[30px] top-1.5 flex h-8 w-8 items-center justify-center bg-[#141416] rounded-full ring-4 ring-slate-900">
              {getActivityIcon(activity.activity_type)}
            </span>
            
            {/* Activity Card */}
            <div className="bg-[#111113] p-4 border border-[#2A2A2D] rounded-xl space-y-2 group-hover:border-[#D4A853]/20 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#1C1C1F] text-[#C4C0B8] uppercase text-[9px] font-semibold py-0">
                    {activity.activity_type}
                  </Badge>
                  <span className="text-[10px] text-[#5A5853]">{formattedDate}</span>
                </div>
                <span className="text-[10px] text-[#8A8680] font-semibold bg-[#141416] px-2 py-0.5 rounded-full">
                  Logged by: {activity.performer_name || 'System'}
                </span>
              </div>
              <p className="text-xs text-[#C4C0B8] leading-relaxed font-sans pt-1">
                {activity.summary}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
