'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  Shield,
  UserPlus,
  Loader2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Building,
  KeyRound,
  Sparkles,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import Forbidden from '@/components/shared/forbidden';
import { cn } from '@/lib/utils';

interface UserRecord {
  user_id: number;
  company_id: number;
  role_id: number;
  full_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  role_name: string;
  created_at: string;
}

interface RoleOption {
  role_id: number;
  role_name: string;
  description: string;
  company_id: number | null;
}

const userFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  role_id: z.string().min(1, 'Please select a system role'),
  phone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const roleFormSchema = z.object({
  role_name: z.string().min(2, 'Role name must be at least 2 characters').max(50),
  description: z.string().optional().or(z.literal('')),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export default function UsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const currentUser = session?.user as any;
  const isAdmin = currentUser?.roleName === 'admin' || currentUser?.roleId === 1;

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserRecord[]>({
    queryKey: ['users-list'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    enabled: !!session && isAdmin,
  });

  // Fetch role options
  const { data: roles } = useQuery<RoleOption[]>({
    queryKey: ['roles-options'],
    queryFn: () => fetch('/api/roles').then(res => res.json()),
    enabled: !!session && isAdmin,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role_id: '',
      phone: '',
    },
  });

  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      role_name: '',
      description: '',
    },
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, role_id: parseInt(values.role_id, 10) }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to create user');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('Team member created successfully!');
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create user. Please try again.');
    },
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      fetch(`/api/users/${editingUser?.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: values.full_name,
          role_id: parseInt(values.role_id, 10),
          phone: values.phone || null,
        }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update user');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('Team member updated successfully!');
      setIsOpen(false);
      setEditingUser(null);
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update user.');
    },
  });

  // Deactivate/Soft-Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: number) =>
      fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to deactivate user');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('Team member successfully deactivated.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to deactivate user.');
    },
  });

  // Create Custom Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: (values: RoleFormValues) =>
      fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to create role');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-options'] });
      toast.success('Custom role defined successfully!');
      setIsRoleOpen(false);
      roleForm.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to define custom role.');
    },
  });

  // Delete Custom Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) =>
      fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete role');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-options'] });
      toast.success('Custom role deactivated successfully.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete role.');
    },
  });

  const onSubmit = (values: UserFormValues) => {
    if (editingUser) {
      updateMutation.mutate(values);
    } else {
      if (!values.password) {
        form.setError('password', { message: 'Password is required for new users' });
        return;
      }
      createMutation.mutate(values);
    }
  };

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user);
    form.reset({
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id.toString(),
      phone: user.phone || '',
      password: '', // Password is not modified on simple edit
    });
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditingUser(null);
    form.reset({
      full_name: '',
      email: '',
      role_id: '',
      phone: '',
      password: '',
    });
    setIsOpen(true);
  };

  if (!session) return null;
  if (!isAdmin) return <Forbidden />;

  // Filter out admin from dropdown list: admins are seeded, only Manager and Sales Rep are created
  const filterRoles = roles?.filter(r => r.role_name !== 'admin') || [];

  const columns: ColumnDef<UserRecord>[] = [
    {
      accessorKey: 'full_name',
      header: 'Full Name',
      cell: ({ row }) => (
        <span className="font-semibold text-[#E8E4DD]">{row.original.full_name}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role_name',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role_name;
        let color = 'bg-[#1C1C1F] text-[#C4C0B8]';
        if (role === 'admin') color = 'bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20';
        if (role === 'manager') color = 'bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20';
        return <Badge className={`uppercase text-[10px] tracking-wider border font-semibold ${color}`}>{role}</Badge>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className="bg-[#6B8F71]/10 text-[#6B8F71] hover:bg-[#6B8F71]/10 capitalize text-[10px] tracking-wider font-semibold">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.user_id === currentUser.userId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 text-[#8A8680] hover:text-[#E8E4DD] hover:bg-[#1C1C1F] rounded-md flex items-center justify-center cursor-pointer focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
              <DropdownMenuItem onClick={() => handleEdit(user)} className="hover:bg-[#1C1C1F] focus:bg-[#1C1C1F] cursor-pointer flex items-center gap-2">
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit User</span>
              </DropdownMenuItem>
              {!isSelf && user.role_name !== 'admin' && (
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm(`Are you sure you want to deactivate ${user.full_name}?`)) {
                      deleteMutation.mutate(user.user_id);
                    }
                  }}
                  className="text-[#C75B39] focus:text-[#C75B39] hover:bg-[#1C1C1F] focus:bg-[#1C1C1F] cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Deactivate</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#D4A853]" />
            User Management
          </h1>
          <p className="text-sm text-[#8A8680]">Manage organization team members and authorize access privileges.</p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-2 py-4 px-4 shadow-lg shadow-[#D4A853]/10 cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Add Team Member
        </Button>
      </div>

      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl">
        <CardHeader>
          <CardTitle className="text-[#E8E4DD] text-base">Active Team Accounts</CardTitle>
          <CardDescription className="text-[#8A8680]">
            List of users currently operating in this organization tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={users || []} />
          )}
        </CardContent>
      </Card>

      {/* Roles & System Privileges Management Panel */}
      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2A2A2D]/50 pb-4 gap-4">
          <div>
            <CardTitle className="text-[#E8E4DD] text-base flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-[#D4A853]" />
              Custom Roles & Access Privileges
            </CardTitle>
            <CardDescription className="text-[#8A8680]">
              Define standard operational access groups isolated to this tenant.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              roleForm.reset({ role_name: '', description: '' });
              setIsRoleOpen(true);
            }}
            className="bg-[#1C1C1F] hover:bg-[#2A2A2F] text-[#E8E4DD] border border-[#2A2A2D] text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Define Custom Role
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles?.map((role) => (
              <div
                key={role.role_id}
                className="p-4 bg-[#111113] border border-[#2A2A2D] rounded-xl flex flex-col justify-between hover:border-[#D4A853]/20 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-[#E8E4DD] capitalize">{role.role_name}</span>
                    <Badge
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        role.company_id === null
                          ? "bg-[#6B8F71]/10 text-[#6B8F71] border border-[#6B8F71]/20"
                          : "bg-[#D4A853]/10 text-[#D4A853] border border-[#D4A853]/20"
                      )}
                    >
                      {role.company_id === null ? "Standard" : "Custom"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#8A8680] leading-relaxed mb-4">
                    {role.description || "No custom privileges specified."}
                  </p>
                </div>
                {role.company_id !== null && (
                  <div className="flex justify-end pt-3 border-t border-[#2A2A2D]/50 mt-auto">
                    <Button
                      onClick={() => {
                        if (confirm(`Are you sure you want to deactivate the custom role '${role.role_name}'?`)) {
                          deleteRoleMutation.mutate(role.role_id);
                        }
                      }}
                      variant="destructive"
                      disabled={deleteRoleMutation.isPending}
                      className="h-7 w-7 text-xs bg-red-950/40 text-[#C75B39] hover:bg-red-900 border border-red-900/30 flex items-center justify-center cursor-pointer p-0 rounded-md"
                      title="Delete custom role"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Slideout Sheet Drawer - User Form */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#D4A853]" />
              {editingUser ? 'Edit Team Member' : 'Create Team Member'}
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              {editingUser ? 'Modify profile details and organization role.' : 'Provision credentials for a new team user.'}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Work Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john.doe@company.com"
                        type="email"
                        disabled={!!editingUser}
                        className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D] disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              {!editingUser && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[#C4C0B8]">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-3 h-4 w-4 text-[#5A5853]" />
                          <Input
                            placeholder="••••••••"
                            type="password"
                            className="pl-10 bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D]"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[#C75B39]" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Organization Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8] focus:border-[#D4A853]">
                          <SelectValue placeholder="Select a system role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        {filterRoles.map(role => (
                          <SelectItem key={role.role_id} value={role.role_id.toString()} className="hover:bg-[#1C1C1F] focus:bg-[#1C1C1F]">
                            {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
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
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 0100"
                        className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold shadow-lg shadow-[#D4A853]/10 cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingUser ? (
                    'Save Changes'
                  ) : (
                    'Create User'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Slideout Sheet Drawer - Create Custom Role Form */}
      <Sheet open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#D4A853]" />
              Define Custom Role
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Create a custom organization group isolated to this tenant.
            </SheetDescription>
          </SheetHeader>

          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(v => createRoleMutation.mutate(v))} className="space-y-6">
              <FormField
                control={roleForm.control}
                name="role_name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Role Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Customer Success"
                        className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={roleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Role Description / Scope</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Define the scope and operational privileges for this role..."
                        className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D] min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button
                  type="button"
                  onClick={() => setIsRoleOpen(false)}
                  variant="outline"
                  className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold shadow-lg shadow-[#D4A853]/10 cursor-pointer"
                >
                  {createRoleMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Define Role'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
