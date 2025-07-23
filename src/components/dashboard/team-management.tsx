'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Mail, Shield, Users, Settings, Trash2, RotateCcw, Crown, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission, canManageUser } from '@/lib/rbac-service';
import { useToast } from '@/hooks/use-toast';
import type { AuthenticatedUser, UserRole, UserInvitation } from '@/lib/types';
import {
  getTeamMembers,
  getInvitations,
  inviteTeamMember,
  updateTeamMember,
  deactivateTeamMember,
  reactivateTeamMember,
  revokeInvitation,
  resendInvitation,
  deleteInvitation,
} from '@/lib/team-service';

export function TeamManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = React.useState<AuthenticatedUser[]>([]);
  const [invitations, setInvitations] = React.useState<UserInvitation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Check permissions
  const canManageUsers = hasPermission(user, 'users.read');
  const canInviteUsers = hasPermission(user, 'users.write');

  React.useEffect(() => {
    if (!canManageUsers) {
      setError('You do not have permission to view team management.');
      setIsLoading(false);
      return;
    }

    loadData();
  }, [canManageUsers, user?.organizationId]);

  const loadData = async () => {
    if (!user?.organizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [members, invites] = await Promise.all([
        getTeamMembers(user.organizationId),
        getInvitations(user.organizationId),
      ]);
      
      setTeamMembers(members);
      setInvitations(invites);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load team data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (email: string, role: UserRole) => {
    if (!user?.organizationId || !user?.organizationName) return;
    
    setActionLoading('invite');
    try {
      await inviteTeamMember(email, role, user.organizationId, user.organizationName, user.id, user.name);
      await loadData();
      toast({
        title: 'Success',
        description: `Invitation sent to ${email}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateMember = async (userId: string, updates: Partial<Pick<AuthenticatedUser, 'role' | 'isActive'>>) => {
    setActionLoading(userId);
    try {
      await updateTeamMember(userId, updates);
      await loadData();
      toast({
        title: 'Success',
        description: 'Team member updated successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team member';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateMember = async (userId: string) => {
    setActionLoading(userId);
    try {
      await deactivateTeamMember(userId);
      await loadData();
      toast({
        title: 'Success',
        description: 'Team member deactivated',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate team member';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateMember = async (userId: string) => {
    setActionLoading(userId);
    try {
      await reactivateTeamMember(userId);
      await loadData();
      toast({
        title: 'Success',
        description: 'Team member reactivated',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reactivate team member';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await revokeInvitation(invitationId);
      await loadData();
      toast({
        title: 'Success',
        description: 'Invitation revoked',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke invitation';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await resendInvitation(invitationId);
      await loadData();
      toast({
        title: 'Success',
        description: 'Invitation resent',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access team management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage team members, roles, and invitations</p>
        </div>
        {canInviteUsers && (
          <InviteTeamMemberDialog 
            onInvite={handleInviteUser} 
            isLoading={actionLoading === 'invite'}
          />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-2" />
            Team Members ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Mail className="w-4 h-4 mr-2" />
            Pending Invitations ({invitations.filter(i => i.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="revoked">
            <AlertCircle className="w-4 h-4 mr-2" />
            Revoked Invitations ({invitations.filter(i => i.status === 'revoked').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <TeamMembersTable 
            members={teamMembers} 
            currentUser={user} 
            onDeactivate={handleDeactivateMember}
            onReactivate={handleReactivateMember}
            onUpdate={handleUpdateMember}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="pending">
          <InvitationsTable 
            invitations={invitations.filter(i => i.status === 'pending')} 
            onRevoke={handleRevokeInvitation}
            onResend={handleResendInvitation}
            actionLoading={actionLoading}
            title="Pending Invitations"
            description="Invitations that have been sent but not yet accepted"
            emptyMessage="No pending invitations"
          />
        </TabsContent>

        <TabsContent value="revoked">
          <InvitationsTable 
            invitations={invitations.filter(i => i.status === 'revoked')} 
            onRevoke={handleRevokeInvitation}
            onResend={handleResendInvitation}
            actionLoading={actionLoading}
            title="Revoked Invitations"
            description="Invitations that have been cancelled"
            emptyMessage="No revoked invitations"
            showActions={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InviteTeamMemberDialog({ 
  onInvite, 
  isLoading 
}: { 
  onInvite: (email: string, role: UserRole) => Promise<void>;
  isLoading: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('agent');
  const [errors, setErrors] = React.useState<{ email?: string; role?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; role?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!role) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onInvite(email.trim().toLowerCase(), role);
      setOpen(false);
      setEmail('');
      setRole('agent');
      setErrors({});
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (!newOpen) {
        setErrors({});
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Team Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="user@company.com"
              className={errors.email ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select 
              value={role} 
              onValueChange={(value: UserRole) => {
                setRole(value);
                if (errors.role) {
                  setErrors(prev => ({ ...prev, role: undefined }));
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="readonly">
                  <div className="flex flex-col">
                    <span className="font-medium">Read Only</span>
                    <span className="text-xs text-muted-foreground">View tickets and analytics</span>
                  </div>
                </SelectItem>
                <SelectItem value="agent">
                  <div className="flex flex-col">
                    <span className="font-medium">Agent</span>
                    <span className="text-xs text-muted-foreground">Handle and manage tickets</span>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex flex-col">
                    <span className="font-medium">Manager</span>
                    <span className="text-xs text-muted-foreground">Team oversight and reporting</span>
                  </div>
                </SelectItem>
                <SelectItem value="org_admin">
                  <div className="flex flex-col">
                    <span className="font-medium">Organization Admin</span>
                    <span className="text-xs text-muted-foreground">Full organizational control</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500 mt-1">{errors.role}</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim() || !role}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamMembersTable({ 
  members, 
  currentUser, 
  onDeactivate,
  onReactivate,
  onUpdate,
  actionLoading 
}: {
  members: AuthenticatedUser[];
  currentUser: AuthenticatedUser | null;
  onDeactivate: (userId: string) => Promise<void>;
  onReactivate: (userId: string) => Promise<void>;
  onUpdate: (userId: string, updates: Partial<Pick<AuthenticatedUser, 'role' | 'isActive'>>) => Promise<void>;
  actionLoading: string | null;
}) {
  const { toast } = useToast();
  const [editingRole, setEditingRole] = React.useState<string | null>(null);
  const [newRole, setNewRole] = React.useState<UserRole>('agent');
  
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'org_admin': return 'default';
      case 'manager': return 'secondary';
      case 'agent': return 'outline';
      case 'readonly': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
      case 'org_admin':
        return <Crown className="w-3 h-3 mr-1" />;
      case 'manager':
        return <Shield className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const validateRoleUpdate = (targetMember: AuthenticatedUser, newRole: UserRole): string | null => {
    if (!currentUser) return 'Current user not found';
    
    // Prevent self-role changes to higher privileges
    if (targetMember.id === currentUser.id) {
      const roleHierarchy = ['readonly', 'agent', 'manager', 'org_admin', 'super_admin'];
      const currentRoleIndex = roleHierarchy.indexOf(currentUser.role);
      const newRoleIndex = roleHierarchy.indexOf(newRole);
      
      if (newRoleIndex > currentRoleIndex) {
        return 'You cannot promote yourself to a higher role';
      }
    }
    
    // Only org_admin and super_admin can assign org_admin role
    if (newRole === 'org_admin' && !['org_admin', 'super_admin'].includes(currentUser.role)) {
      return 'Only organization administrators can assign admin roles';
    }
    
    // Only super_admin can assign super_admin role
    if (newRole === 'super_admin' && currentUser.role !== 'super_admin') {
      return 'Only super administrators can assign super admin roles';
    }
    
    return null;
  };

  const handleRoleUpdate = async (userId: string, role: UserRole) => {
    const targetMember = members.find(m => m.id === userId);
    if (!targetMember) return;
    
    const validationError = validateRoleUpdate(targetMember, role);
    if (validationError) {
      toast({
        title: 'Permission Denied',
        description: validationError,
        variant: 'destructive',
      });
      setEditingRole(null);
      return;
    }
    
    await onUpdate(userId, { role });
    setEditingRole(null);
  };

  const startRoleEdit = (userId: string, currentRole: UserRole) => {
    setEditingRole(userId);
    setNewRole(currentRole);
  };

  const handleDeactivateWithConfirmation = async (member: AuthenticatedUser) => {
    // Prevent self-deactivation
    if (currentUser && member.id === currentUser.id) {
      toast({
        title: 'Action Not Allowed',
        description: 'You cannot deactivate your own account',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation for critical roles
    if (['org_admin', 'super_admin'].includes(member.role)) {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate ${member.name}? This will remove their administrative access.`
      );
      if (!confirmed) return;
    }

    await onDeactivate(member.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage team member accounts and roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center w-fit">
                    {getRoleIcon(member.role)}
                    {member.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={member.isActive ? 'default' : 'secondary'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {currentUser && canManageUser(currentUser, member) && (
                      <>
                        {editingRole === member.id ? (
                          <div className="flex space-x-2 items-center">
                            <Select 
                              value={newRole} 
                              onValueChange={(value: UserRole) => setNewRole(value)}
                              disabled={actionLoading === member.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="readonly">Read Only</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="org_admin">Org Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleRoleUpdate(member.id, newRole)}
                              disabled={actionLoading === member.id}
                            >
                              {actionLoading === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRole(null)}
                              disabled={actionLoading === member.id}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            {member.isActive ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeactivateWithConfirmation(member)}
                                disabled={actionLoading === member.id}
                              >
                                {actionLoading === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReactivate(member.id)}
                                disabled={actionLoading === member.id}
                              >
                                {actionLoading === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startRoleEdit(member.id, member.role)}
                              disabled={actionLoading === member.id}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InvitationsTable({ 
  invitations, 
  onRevoke,
  onResend,
  actionLoading,
  title = "Invitations",
  description = "Manage invitations",
  emptyMessage = "No invitations",
  showActions = true
}: {
  invitations: UserInvitation[];
  onRevoke: (invitationId: string) => Promise<void>;
  onResend: (invitationId: string) => Promise<void>;
  actionLoading: string | null;
  title?: string;
  description?: string;
  emptyMessage?: string;
  showActions?: boolean;
}) {
  const { toast } = useToast();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'accepted': return 'default';
      case 'expired': return 'secondary';
      case 'revoked': return 'destructive';
      default: return 'outline';
    }
  };

  const isInvitationExpired = (invitation: UserInvitation): boolean => {
    return new Date(invitation.expiresAt) < new Date();
  };

  const getEffectiveStatus = (invitation: UserInvitation): string => {
    if (invitation.status === 'pending' && isInvitationExpired(invitation)) {
      return 'expired';
    }
    return invitation.status;
  };

  const handleResendWithValidation = async (invitation: UserInvitation) => {
    if (invitation.status !== 'pending') {
      toast({
        title: 'Cannot Resend',
        description: 'Only pending invitations can be resent',
        variant: 'destructive',
      });
      return;
    }
    await onResend(invitation.id);
  };

  const handleRevokeWithConfirmation = async (invitation: UserInvitation) => {
    if (invitation.status !== 'pending') {
      toast({
        title: 'Cannot Revoke',
        description: 'Only pending invitations can be revoked',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to revoke the invitation for ${invitation.email}?`
    );
    if (!confirmed) return;

    await onRevoke(invitation.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invitation.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(getEffectiveStatus(invitation))}>
                      {getEffectiveStatus(invitation)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={isInvitationExpired(invitation) ? 'text-red-500 font-medium' : ''}>
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                      {isInvitationExpired(invitation) && ' (Expired)'}
                    </span>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex space-x-2">
                        {getEffectiveStatus(invitation) === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendWithValidation(invitation)}
                              disabled={actionLoading === invitation.id}
                              title={isInvitationExpired(invitation) ? 'Resend expired invitation' : 'Resend invitation'}
                            >
                              {actionLoading === invitation.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeWithConfirmation(invitation)}
                              disabled={actionLoading === invitation.id}
                              title="Revoke invitation"
                            >
                              {actionLoading === invitation.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}