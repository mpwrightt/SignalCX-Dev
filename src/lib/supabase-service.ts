import { createSupabaseBrowserClient } from './supabase-config'
import { AuthenticatedUser, Organization, UserInvitation } from './types'
import { getRolePermissions } from './rbac-service'

interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

class SupabaseService {
  // =============================================================================
  // User Operations
  // =============================================================================


  async createUser(user: Partial<AuthenticatedUser>): Promise<ServiceResult<string>> {
    try {
      // Validate required fields
      if (!user.email) {
        return {
          success: false,
          error: 'Email is required'
        }
      }
      
      // Validate email format
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(user.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        }
      }

      const supabase = createSupabaseBrowserClient()
      
      // Check if user already exists by email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (existingUser) {
        // User already exists, return existing ID
        return {
          success: true,
          data: existingUser.id
        }
      }

      // Generate a UUID for new user
      const supabaseUserId = crypto.randomUUID()
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: supabaseUserId,
          email: user.email!,
          display_name: user.name,
          photo_url: user.avatar,
          role: user.role || 'readonly',
          organization_id: user.organizationId || await this.getOrCreateDefaultOrganization(),
          is_active: user.isActive ?? true,
          email_verified: user.emailVerified ?? true,
          firebase_uid: null // No Firebase integration
        })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  async getUser(userId: string): Promise<{ data: AuthenticatedUser | null, error: string | null }> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Find user by Supabase UUID
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'User not found' }
        }
        return { data: null, error: error.message }
      }

      if (!data) {
        return { data: null, error: 'User not found' }
      }

      // Map Supabase user data to AuthenticatedUser type
      const user: AuthenticatedUser = {
        id: data.id,
        name: data.display_name || '',
        email: data.email,
        role: data.role,
        organizationId: data.organization_id,
        organizationName: 'Unknown Organization', // Note: need to join organizations table for this
        avatar: data.photo_url || '',
        permissions: getRolePermissions(data.role), // Computed from role
        isActive: data.is_active,
        lastLoginAt: data.last_login || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        emailVerified: data.email_verified || true
      }

      return { data: user, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  async updateUser(userId: string, updates: Partial<AuthenticatedUser>): Promise<ServiceResult<string>> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('users')
        .update({
          ...(updates.name && { display_name: updates.name }),
          ...(updates.avatar && { photo_url: updates.avatar }),
          ...(updates.role && { role: updates.role }),
          ...(updates.organizationId && { organization_id: updates.organizationId }),
          ...(updates.isActive !== undefined && { is_active: updates.isActive }),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  // =============================================================================
  // Organization Operations
  // =============================================================================

  async createOrganization(org: Partial<Organization>): Promise<ServiceResult<string>> {
    try {
      const orgId = org.id || crypto.randomUUID()
      const supabase = createSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          id: orgId,
          name: org.name!,
          domain: org.domain,
          logo: org.logo,
          settings: org.settings || {},
          owner_id: org.ownerId,
          is_active: org.isActive ?? true,
          plan: org.plan || 'free',
          max_users: org.maxUsers || 5,
          current_users: org.currentUsers || 0
        })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  // =============================================================================
  // Invitation Operations
  // =============================================================================

  async createInvitation(invitation: Partial<UserInvitation>): Promise<ServiceResult<string>> {
    try {
      const invitationId = invitation.id || crypto.randomUUID()
      const supabase = createSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          id: invitationId,
          email: invitation.email!,
          role: invitation.role!,
          organization_id: invitation.organizationId!,
          token: invitation.token!,
          invited_by: invitation.invitedBy!,
          expires_at: invitation.expiresAt!,
          status: (invitation.status as any) || 'pending'
        })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  async updateInvitation(invitationId: string, updates: Partial<UserInvitation>): Promise<ServiceResult<string>> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('invitations')
        .update({
          ...(updates.status && { status: updates.status as any }),
          ...(updates.invitedAt && { accepted_at: updates.invitedAt })
        })
        .eq('id', invitationId)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  // =============================================================================
  // Audit Logging
  // =============================================================================

  async logAuditEvent(
    organizationId: string,
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): Promise<ServiceResult<string>> {
    try {
      const auditId = crypto.randomUUID()
      const supabase = createSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          id: auditId,
          organization_id: organizationId,
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          metadata: metadata || {}
        })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  private async getOrCreateDefaultOrganization(): Promise<string> {
    const defaultOrgId = '00000000-0000-0000-0000-000000000001'
    
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', defaultOrgId)
      .single()
    
    if (!data && !error?.message.includes('No rows found')) {
      // Create default organization
      await supabase
        .from('organizations')
        .insert({
          id: defaultOrgId,
          name: 'SignalCX Organization',
          is_active: true,
          plan: 'pro',
          max_users: 100
        })
    }
    
    return defaultOrgId
  }

  // =============================================================================
  // Health Check
  // =============================================================================

  async healthCheck(): Promise<{ supabase: boolean }> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('organizations').select('id').limit(1)
      return { supabase: !error }
    } catch (error) {
      return { supabase: false }
    }
  }
}

export const supabaseService = new SupabaseService()