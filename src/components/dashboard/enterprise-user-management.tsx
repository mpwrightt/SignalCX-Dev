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
import { UserPlus, Mail, Shield, Users, Building, Settings, Trash2, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission, canManageUser } from '@/lib/rbac-service';
import type { AuthenticatedUser, UserRole, Organization, UserInvitation } from '@/lib/types';

export function EnterpriseUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = React.useState<AuthenticatedUser[]>([]);
  const [invitations, setInvitations] = React.useState<UserInvitation[]>([]);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Check permissions
  const canManageUsers = hasPermission(user, 'users.read');
  const canInviteUsers = hasPermission(user, 'users.write');
  const canManageOrgs = hasPermission(user, 'org.read');

  React.useEffect(() => {
    if (!canManageUsers) {
      setError('You do not have permission to view user management.');
      setIsLoading(false);
      return;
    }

    loadData();
  }, [canManageUsers]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, these would be API calls
      // For now, using mock data
      const mockUsers: AuthenticatedUser[] = [
        {
          id: 'user-1',
          name: 'John Smith',
          email: 'john@company.com',
          role: 'manager',
          avatar: 'https://placehold.co/32x32.png',
          organizationId: 'org-1',
          organizationName: 'Acme Corp',
          department: 'Support',
          permissions: ['users.read', 'tickets.read', 'tickets.write', 'analytics.read'],
          isActive: true,
          lastLoginAt: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          emailVerified: true,
        }
      ];

      const mockInvitations: UserInvitation[] = [
        {
          id: 'inv-1',
          email: 'jane@company.com',
          role: 'agent',
          organizationId: 'org-1',
          invitedBy: user?.id || '',
          invitedAt: '2024-01-16T00:00:00Z',
          status: 'pending',
          expiresAt: '2024-02-01T00:00:00Z',
          token: 'token-123',
        }
      ];

      const mockOrganizations: Organization[] = [
        {
          id: 'org-1',
          name: 'Acme Corp',
          domain: 'company.com',
          settings: {
            allowSelfRegistration: false,
            requireEmailVerification: true,
            sessionTimeoutMinutes: 60,
            enableAuditLogging: true,
            allowedDomains: ['company.com'],
            customBranding: {
              companyName: 'Acme Corp'
            }
          },
          ownerId: user?.id || '',
          isActive: true,
          plan: 'pro',
          maxUsers: 100,
          currentUsers: 15,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      ];

      setUsers(mockUsers);
      setInvitations(mockInvitations);
      setOrganizations(mockOrganizations);
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access user management.
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        {canInviteUsers && (
          <InviteUserDialog onInvite={loadData} />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="w-4 h-4 mr-2" />
            Invitations
          </TabsTrigger>
          {canManageOrgs && (
            <TabsTrigger value="organizations">
              <Building className="w-4 h-4 mr-2" />
              Organizations
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="users">
          <UsersTable users={users} currentUser={user} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationsTable invitations={invitations} onUpdate={loadData} />
        </TabsContent>

        {canManageOrgs && (
          <TabsContent value="organizations">
            <OrganizationsTable organizations={organizations} onUpdate={loadData} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function InviteUserDialog({ onInvite }: { onInvite: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('agent');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In real implementation, this would call an API
      console.log('Inviting user:', { email, role });
      
      setOpen(false);
      setEmail('');
      setRole('agent');
      onInvite();
    } catch (error) {
      console.error('Failed to invite user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="readonly">Read Only</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="org_admin">Organization Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UsersTable({ users, currentUser, onUpdate }: {
  users: AuthenticatedUser[];
  currentUser: AuthenticatedUser | null;
  onUpdate: () => void;
}) {
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

  const handleDeactivateUser = async (user: AuthenticatedUser) => {
    // In real implementation, this would call an API
    console.log('Deactivating user:', user.id);
    onUpdate();
  };

  const handleReactivateUser = async (user: AuthenticatedUser) => {
    // In real implementation, this would call an API
    console.log('Reactivating user:', user.id);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.organizationName}</div>
                    {user.department && (
                      <div className="text-sm text-muted-foreground">{user.department}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {currentUser && canManageUser(currentUser, user) && (
                      <>
                        {user.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateUser(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivateUser(user)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4" />
                        </Button>
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

function InvitationsTable({ invitations, onUpdate }: {
  invitations: UserInvitation[];
  onUpdate: () => void;
}) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'accepted': return 'default';
      case 'expired': return 'secondary';
      case 'revoked': return 'destructive';
      default: return 'outline';
    }
  };

  const handleRevokeInvitation = async (invitation: UserInvitation) => {
    // In real implementation, this would call an API
    console.log('Revoking invitation:', invitation.id);
    onUpdate();
  };

  const handleResendInvitation = async (invitation: UserInvitation) => {
    // In real implementation, this would call an API
    console.log('Resending invitation:', invitation.id);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          Manage user invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>{invitation.invitedBy}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invitation.status)}>
                    {invitation.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(invitation)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeInvitation(invitation)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

function OrganizationsTable({ organizations, onUpdate }: {
  organizations: Organization[];
  onUpdate: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>
          Manage organizations and tenant settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>{org.domain}</TableCell>
                <TableCell>
                  <Badge variant={org.isActive ? 'default' : 'secondary'}>
                    {org.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(org.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}