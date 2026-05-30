'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Circle, ArrowRight, X, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  isCompleted: boolean;
}

export default function SetupChecklist() {
  const [isVisible, setIsVisible] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    // Check localStorage if user has dismissed the checklist
    const isDismissed = localStorage.getItem('multi_crm_onboarding_dismissed');
    if (isDismissed === 'true') {
      setIsVisible(false);
      return;
    }

    // Load progress checks or mock completed items
    const items: ChecklistItem[] = [
      { id: '1', label: 'Company registered', href: '', isCompleted: true },
      { id: '2', label: 'Admin account created', href: '', isCompleted: true },
      { id: '3', label: 'Add your first team member', href: '/dashboard/users', isCompleted: false },
      { id: '4', label: 'Add your first contact', href: '/dashboard/contacts', isCompleted: false },
      { id: '5', label: 'Create your first lead', href: '/dashboard/leads', isCompleted: false },
      { id: '6', label: 'Set up a deal', href: '/dashboard/deals', isCompleted: false },
    ];

    // Load custom checklist completion states if saved
    const savedStates = localStorage.getItem('multi_crm_onboarding_states');
    if (savedStates) {
      try {
        const parsed = JSON.parse(savedStates);
        const merged = items.map(item => ({
          ...item,
          isCompleted: parsed[item.id] !== undefined ? parsed[item.id] : item.isCompleted,
        }));
        setChecklist(merged);
        
        // Auto-dismiss if all items are completed
        const allDone = merged.every(item => item.isCompleted);
        if (allDone) {
          setIsVisible(false);
          return;
        }
      } catch (e) {
        setChecklist(items);
      }
    } else {
      setChecklist(items);
    }
    
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('multi_crm_onboarding_dismissed', 'true');
    setIsVisible(false);
  };

  const toggleComplete = (id: string) => {
    // 1 and 2 are always true
    if (id === '1' || id === '2') return;

    const updated = checklist.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setChecklist(updated);

    // Save state
    const states = updated.reduce((acc, curr) => {
      acc[curr.id] = curr.isCompleted;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem('multi_crm_onboarding_states', JSON.stringify(states));

    // Auto-dismiss if all items are done
    const allDone = updated.every(item => item.isCompleted);
    if (allDone) {
      localStorage.setItem('multi_crm_onboarding_dismissed', 'true');
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  const completedCount = checklist.filter(i => i.isCompleted).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <Card className="bg-[#141416] border-[#D4A853]/15 text-[#E8E4DD] shadow-xl overflow-hidden relative animate-fade-up">
      {/* Warm glow background */}
      <div className="absolute right-0 top-0 w-40 h-40 bg-[#D4A853]/5 blur-[60px] rounded-full pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[#D4A853]">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Getting Started</span>
          </div>
          <CardTitle className="text-[#E8E4DD] text-lg font-heading">Set up your workspace</CardTitle>
          <CardDescription className="text-[#8A8680] text-xs">
            Complete these steps to get your CRM pipeline running.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-[#2A2A2D] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D4A853] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-[#D4A853]">{progressPercent}%</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDismiss}
            className="h-7 w-7 text-[#5A5853] hover:text-[#E8E4DD] hover:bg-[#1C1C1F] rounded-full cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
        {checklist.map(item => {
          const isCore = item.id === '1' || item.id === '2';
          
          return (
            <div 
              key={item.id}
              className={`p-3 rounded-lg border flex items-center justify-between transition-all duration-200 ${
                item.isCompleted 
                  ? 'bg-[#111113] border-[#2A2A2D]/50 opacity-60' 
                  : 'bg-[#1C1C1F]/50 border-[#2A2A2D] hover:border-[#D4A853]/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isCore}
                  onClick={() => toggleComplete(item.id)}
                  className={`focus:outline-none transition-transform duration-200 ${isCore ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="h-[18px] w-[18px] text-[#D4A853]" />
                  ) : (
                    <Circle className="h-[18px] w-[18px] text-[#3A3A3D]" />
                  )}
                </button>
                <span className={`text-[12px] font-medium ${item.isCompleted ? 'line-through text-[#5A5853]' : 'text-[#C4C0B8]'}`}>
                  {item.label}
                </span>
              </div>
              
              {!item.isCompleted && item.href && (
                <Link
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    "h-6 w-6 text-[#D4A853] hover:text-[#E8C87A] hover:bg-[#D4A853]/10 cursor-pointer"
                  )}
                >
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
