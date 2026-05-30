'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  CheckSquare,
  Plus,
  Loader2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  User,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { taskSchema, TaskInput } from '@/lib/validations/task';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskRecord {
  task_id: number;
  company_id: number;
  assigned_to?: number;
  deal_id?: number;
  contact_id?: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assignee_name?: string;
  deal_title?: string;
  contact_name?: string;
}

export default function TasksPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);

  // 1. Fetch Tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<TaskRecord[]>({
    queryKey: ['tasks-list'],
    queryFn: () => fetch('/api/tasks').then(res => res.json()),
    enabled: !!session,
  });

  // 2. Fetch Team
  const { data: team } = useQuery<any[]>({
    queryKey: ['team-tasks-dropdown'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    enabled: !!session,
  });

  // 3. Fetch Contacts
  const { data: contacts } = useQuery<any[]>({
    queryKey: ['contacts-tasks-dropdown'],
    queryFn: () => fetch('/api/contacts').then(res => res.json()),
    enabled: !!session,
  });

  // 4. Fetch Deals
  const { data: deals } = useQuery<any[]>({
    queryKey: ['deals-tasks-dropdown'],
    queryFn: () => fetch('/api/deals').then(res => res.json()),
    enabled: !!session,
  });

  const form = useForm({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      status: 'pending' as 'pending' | 'in_progress' | 'completed',
      priority: 'medium' as 'low' | 'medium' | 'high',
      assigned_to: null as number | null,
      deal_id: null as number | null,
      contact_id: null as number | null,
      due_date: '',
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to create task');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
      toast.success('Task scheduled successfully.');
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      fetch(`/api/tasks/${editingTask?.task_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update task');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
      toast.success('Task details updated.');
      setIsOpen(false);
      setEditingTask(null);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: 'pending' | 'in_progress' | 'completed' }) =>
      fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update status');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
      toast.success('Task status updated successfully.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: number) =>
      fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete task');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
      toast.success('Task successfully deleted.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = (values: any) => {
    if (editingTask) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (task: TaskRecord) => {
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || null,
      deal_id: task.deal_id || null,
      contact_id: task.contact_id || null,
      due_date: task.due_date ? new Date(task.due_date).toISOString().substring(0, 10) : '',
    });
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditingTask(null);
    form.reset({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      assigned_to: null,
      deal_id: null,
      contact_id: null,
      due_date: '',
    });
    setIsOpen(true);
  };

  const taskStatuses: ('pending' | 'in_progress' | 'completed')[] = ['pending', 'in_progress', 'completed'];
  const tasksByStatus = (status: string) => tasks?.filter(t => t.status === status) || [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-[#D4A853]" />
            Operations Tasks
          </h1>
          <p className="text-sm text-[#8A8680]">Manage internal action plans, team assignments, and operational deadlines.</p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-2 py-4 px-4 shadow-lg shadow-[#D4A853]/10 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Task
        </Button>
      </div>

      {isLoadingTasks ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
        </div>
      ) : (
        /* 3 Column Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {taskStatuses.map(col => {
            const list = tasksByStatus(col);
            let headerColor = 'text-[#5B8FB9]';
            let dotColor = 'bg-blue-400';
            if (col === 'in_progress') {
              headerColor = 'text-[#D4A853]';
              dotColor = 'bg-amber-400';
            }
            if (col === 'completed') {
              headerColor = 'text-[#6B8F71]';
              dotColor = 'bg-emerald-400';
            }

            return (
              <div key={col} className="bg-[#111113] border border-[#2A2A2D] p-4 rounded-xl min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2D] mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                    <span className={`font-bold capitalize text-xs tracking-wider ${headerColor}`}>
                      {col.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge className="bg-[#141416] text-[#8A8680] border border-[#2A2A2D] text-[10px]">
                    {list.length}
                  </Badge>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="text-center py-12 text-[11px] text-[#3A3A3D] font-mono select-none">
                      No active tasks
                    </div>
                  ) : (
                    list.map(task => (
                      <div
                        key={task.task_id}
                        className="bg-[#141416] p-4 border border-[#2A2A2D] rounded-xl space-y-3 shadow hover:border-[#D4A853]/20 transition-all group relative"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-[#E8E4DD] text-xs leading-snug pr-6">
                            {task.title}
                          </h4>
                          <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(task)}
                              className="text-[#8A8680] hover:text-[#E8E4DD] p-1 hover:bg-[#1C1C1F] rounded cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this task?')) deleteMutation.mutate(task.task_id);
                              }}
                              className="text-[#C75B39] hover:text-red-300 p-1 hover:bg-[#1C1C1F] rounded cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-[#8A8680] leading-relaxed font-sans line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Badge className={cn("text-[9px] uppercase border font-bold", 
                            task.priority === 'low' && 'bg-[#5B8FB9]/10 text-[#5B8FB9] border-[#5B8FB9]/20',
                            task.priority === 'medium' && 'bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20',
                            task.priority === 'high' && 'bg-[#C75B39]/10 text-[#C75B39] border-[#C75B39]/20',
                          )}>
                            {task.priority} Priority
                          </Badge>
                          
                          {task.due_date && (
                            <Badge className="bg-[#0D0D0F] text-[#8A8680] border border-[#2A2A2D] text-[9px] font-mono flex items-center gap-1 font-bold">
                              <Calendar className="h-2.5 w-2.5" />
                              {format(new Date(task.due_date), 'MMM d')}
                            </Badge>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-[#5A5853] pt-2 border-t border-[#2A2A2D]">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee_name || 'Unassigned'}
                          </span>
                          
                          {/* status trigger */}
                          <select
                            value={task.status}
                            onChange={(e) => updateStatusMutation.mutate({ taskId: task.task_id, status: e.target.value as any })}
                            className="bg-[#0D0D0F] border border-[#2A2A2D] text-[#8A8680] text-[10px] font-semibold py-0.5 px-1.5 rounded focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">Working</option>
                            <option value="completed">Done</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slideout Form Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-[#D4A853]" />
              {editingTask ? 'Edit Task Details' : 'Schedule Operations Task'}
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Configure details, assignments, scopes, and priorities.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Task Title</FormLabel>
                    <FormControl>
                      <Input className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" placeholder="Draft Service Agreement" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Task Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Outline deliverables, SLAs, and payment collection schedules..." className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[#C4C0B8]">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[#C75B39]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[#C4C0B8]">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[#C75B39]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Assign To Team Member</FormLabel>
                    <Select
                      onValueChange={val => (field.onChange as any)(val === 'unassigned' ? null : (val ? parseInt(val, 10) : null))}
                      value={field.value?.toString() || 'unassigned'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {team?.map((member: any) => (
                          <SelectItem key={member.user_id} value={member.user_id.toString()}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deal_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Link Deal</FormLabel>
                    <Select
                      onValueChange={val => (field.onChange as any)(val === 'none' ? null : (val ? parseInt(val, 10) : null))}
                      value={field.value?.toString() || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="No Linked Deal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="none">No Linked Deal</SelectItem>
                        {deals?.map((d: any) => (
                          <SelectItem key={d.deal_id} value={d.deal_id.toString()}>
                            {d.deal_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Link Contact Profile</FormLabel>
                    <Select
                      onValueChange={val => (field.onChange as any)(val === 'none' ? null : (val ? parseInt(val, 10) : null))}
                      value={field.value?.toString() || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="No Linked Contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="none">No Linked Contact</SelectItem>
                        {contacts?.map((c: any) => (
                          <SelectItem key={c.contact_id} value={c.contact_id.toString()}>
                            {c.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTask ? 'Save Changes' : 'Create Task'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
