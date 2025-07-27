/**
 * Team Management Service - Production Ready
 * Handles all team member and invitation operations with Supabase
 */

import { createSupabaseBrowserClient } from './supabase-config';
import type { AuthenticatedUser, UserRole, UserInvitation } from './types';
import { getRolePermissions } from './rbac-service';

// Email invitation function
async function sendInvitationEmail({
  email,
  organizationName,
  role,
  inviterName,
  token,
}: {
  email: string;
  organizationName: string;
  role: UserRole;
  inviterName: string;
  token: string;
}) {
  const response = await fetch('/api/send-invitation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      organizationName,
      role,
      inviterName,
      token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to send invitation email');
  }

  return response.json();
}

export class TeamService {
  /**
   * Get all team members for an organization
   */
  async getTeamMembers(organizationId: string): Promise<AuthenticatedUser[]> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team members:', error);
        throw new Error('Failed to fetch team members');
      }

      return data.map(this.mapSupabaseUserToAuth);
    } catch (error) {
      console.error('Error in getTeamMembers:', error);
      throw error;
    }
  }

  /**
   * Update a team member's role
   */
  async updateMemberRole(
    userId: string,
    newRole: UserRole,
    updatedBy: string
  ): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Update user role
      const { error } = await supabase
        .from('users')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating member role:', error);
        throw new Error('Failed to update member role');
      }

      // Log audit event
      await this.logAuditEvent(userId, updatedBy, 'ROLE_UPDATED', {
        newRole,
        userId
      });
    } catch (error) {
      console.error('Error in updateMemberRole:', error);
      throw error;
    }
  }

  /**
   * Deactivate a team member (soft delete)
   */
  async deactivateMember(
    userId: string,
    deactivatedBy: string
  ): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Deactivate user
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deactivating member:', error);
        throw new Error('Failed to deactivate member');
      }

      // Log audit event
      await this.logAuditEvent(userId, deactivatedBy, 'USER_DEACTIVATED', {
        userId
      });
    } catch (error) {
      console.error('Error in deactivateMember:', error);
      throw error;
    }
  }

  /**
   * Reactivate a team member
   */
  async reactivateMember(
    userId: string,
    reactivatedBy: string
  ): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Reactivate user
      const { error } = await supabase
        .from('users')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error reactivating member:', error);
        throw new Error('Failed to reactivate member');
      }

      // Log audit event
      await this.logAuditEvent(userId, reactivatedBy, 'USER_REACTIVATED', {
        userId
      });
    } catch (error) {
      console.error('Error in reactivateMember:', error);
      throw error;
    }
  }

  /**
   * Get all invitations for an organization
   */
  async getInvitations(organizationId: string): Promise<UserInvitation[]> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw new Error('Failed to fetch invitations');
      }

      return data.map(this.mapSupabaseInvitationToType);
    } catch (error) {
      console.error('Error in getInvitations:', error);
      throw error;
    }
  }

  /**
   * Create and send a new invitation
   */
  async createInvitation({
    email,
    role,
    organizationId,
    organizationName,
    invitedBy,
    inviterName,
  }: {
    email: string;
    role: UserRole;
    organizationId: string;
    organizationName: string;
    invitedBy: string;
    inviterName: string;
  }): Promise<UserInvitation> {
    try {
      // Check if invitation already exists
      const existingInvitation = await this.getInvitationByEmail(
        email,
        organizationId
      );
      if (existingInvitation) {
        throw new Error('Invitation already exists for this email');
      }

      // Generate secure token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const supabase = createSupabaseBrowserClient();
      
      // Create invitation
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email,
          role,
          organization_id: organizationId,
          token,
          invited_by: invitedBy,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        throw new Error('Failed to create invitation');
      }

      // Send invitation email
      await sendInvitationEmail({
        email,
        organizationName,
        role,
        inviterName,
        token,
      });

      // Log audit event
      await this.logAuditEvent(organizationId, invitedBy, 'INVITATION_CREATED', {
        email,
        role,
        invitationId: data.id
      });

      return this.mapSupabaseInvitationToType(data);
    } catch (error) {
      console.error('Error in createInvitation:', error);
      throw error;
    }
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(
    invitationId: string,
    revokedBy: string
  ): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Update invitation status
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) {
        console.error('Error revoking invitation:', error);
        throw new Error('Failed to revoke invitation');
      }

      // Log audit event
      await this.logAuditEvent(invitationId, revokedBy, 'INVITATION_REVOKED', {
        invitationId
      });
    } catch (error) {
      console.error('Error in revokeInvitation:', error);
      throw error;
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(
    invitationId: string,
    organizationName: string,
    inviterName: string
  ): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Get invitation details
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (error || !invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Can only resend pending invitations');
      }

      // Check if not expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Resend email
      await sendInvitationEmail({
        email: invitation.email,
        organizationName,
        role: invitation.role,
        inviterName,
        token: invitation.token,
      });

      // Log audit event
      await this.logAuditEvent(
        invitation.organization_id,
        invitation.invited_by,
        'INVITATION_RESENT',
        { invitationId }
      );
    } catch (error) {
      console.error('Error in resendInvitation:', error);
      throw error;
    }
  }

  /**
   * Get invitation by email for organization
   */
  private async getInvitationByEmail(
    email: string,
    organizationId: string
  ): Promise<UserInvitation | null> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing invitation:', error);
        return null;
      }

      return data ? this.mapSupabaseInvitationToType(data) : null;
    } catch (error) {
      console.error('Error in getInvitationByEmail:', error);
      return null;
    }
  }

  /**
   * Log audit event with detailed error reporting
   */
  private async logAuditEvent(
    organizationId: string,
    userId: string,
    action: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient();
      
      console.log('[AUDIT] Attempting to log:', { organizationId, userId, action });
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          action,
          resource_type: 'team_management',
          metadata
        })
        .select();

      if (error) {
        console.error('[AUDIT] Database error:', error);
        console.error('[AUDIT] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('[AUDIT] Successfully logged:', data);
      }
    } catch (error) {
      console.error('[AUDIT] Unexpected error:', error);
      // Don't throw here - audit logging failure shouldn't break the operation
    }
  }

  /**
   * Map Supabase user data to AuthenticatedUser type
   */
  private mapSupabaseUserToAuth(user: any): AuthenticatedUser {
    return {
      id: user.id,
      name: user.display_name || '',
      email: user.email,
      role: user.role,
      avatar: user.photo_url || '',
      organizationId: user.organization_id,
      permissions: getRolePermissions(user.role),
      isActive: user.is_active,
      lastLoginAt: user.last_login || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      emailVerified: user.email_verified || true
    };
  }

  /**
   * Map Supabase invitation data to UserInvitation type
   */
  private mapSupabaseInvitationToType(inv: any): UserInvitation {
    return {
      id: inv.id,
      email: inv.email,
      role: inv.role,
      organizationId: inv.organization_id,
      invitedBy: inv.invited_by,
      invitedAt: inv.created_at,
      expiresAt: inv.expires_at,
      status: inv.status,
      token: inv.token,
      // acceptedAt and revokedAt are handled by status field
    };
  }
}

// Export singleton instance
export const teamService = new TeamService();