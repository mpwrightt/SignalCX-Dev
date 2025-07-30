import { createSupabaseBrowserClient, Database } from './supabase-config'
import { AuthenticatedUser, Organization, Ticket, UserInvitation } from './types'

export interface DatabaseResult<T> {
  data: T | null
  error: string | null
}

export interface DatabaseListResult<T> {
  data: T[]
  error: string | null
}

class DatabaseService {
  // =============================================================================
  // Users
  // =============================================================================

  async getUser(userId: string): Promise<DatabaseResult<AuthenticatedUser>> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Find user by Supabase UUID
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)

      if (error) {
        return { data: null, error: error.message }
      }

      // Handle multiple or no rows
      if (!data || data.length === 0) {
        return { data: null, error: 'User not found' }
      }

      // If multiple rows, take the first active one or just the first
      const userData = Array.isArray(data) 
        ? (data.find(u => u.is_active) || data[0])
        : data

      return { 
        data: this.mapSupabaseUserToAuth(userData), 
        error: null 
      }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  async createUser(user: Partial<AuthenticatedUser>): Promise<DatabaseResult<AuthenticatedUser>> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          display_name: user.name,
          photo_url: user.avatar,
          role: user.role || 'readonly',
          organization_id: user.organizationId!,
          is_active: user.isActive ?? true,
          
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { 
        data: this.mapSupabaseUserToAuth(data), 
        error: null 
      }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  async getUsersByOrganization(organizationId: string): Promise<DatabaseListResult<AuthenticatedUser>> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at')

      if (error) {
        return { data: [], error: error.message }
      }

      return { 
        data: data.map(user => this.mapSupabaseUserToAuth(user)), 
        error: null 
      }
    } catch (error) {
      return { data: [], error: (error as Error).message }
    }
  }

  // =============================================================================
  // Organizations
  // =============================================================================

  async getOrganization(organizationId: string): Promise<DatabaseResult<Organization>> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { 
        data: this.mapSupabaseOrgToType(data), 
        error: null 
      }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  // =============================================================================
  // Tickets
  // =============================================================================

  async getTicketsByOrganization(
    organizationId: string, 
    limitCount?: number
  ): Promise<DatabaseListResult<Ticket>> {
    try {
      const supabase = createSupabaseBrowserClient()
      let query = supabase
        .from('tickets')
        .select('*, conversations(*)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (limitCount) {
        query = query.limit(limitCount)
      }

      const { data, error } = await query

      if (error) {
        return { data: [], error: error.message }
      }

      return { 
        data: data.map(ticket => this.mapSupabaseTicketToType(ticket)), 
        error: null 
      }
    } catch (error) {
      return { data: [], error: (error as Error).message }
    }
  }

  // =============================================================================
  // Invitations
  // =============================================================================

  async getInvitationsByOrganization(organizationId: string): Promise<DatabaseListResult<UserInvitation>> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error: error.message }
      }

      return { 
        data: data.map(inv => this.mapSupabaseInvitationToType(inv)), 
        error: null 
      }
    } catch (error) {
      return { data: [], error: (error as Error).message }
    }
  }

  async createInvitation(invitation: Partial<UserInvitation>): Promise<DatabaseResult<UserInvitation>> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email: invitation.email!,
          role: invitation.role!,
          organization_id: invitation.organizationId!,
          token: invitation.token!,
          invited_by: invitation.invitedBy!,
          expires_at: invitation.expiresAt!
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { 
        data: this.mapSupabaseInvitationToType(data), 
        error: null 
      }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  async getInvitation(invitationId: string): Promise<DatabaseResult<UserInvitation>> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { 
        data: this.mapSupabaseInvitationToType(data), 
        error: null 
      }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  // =============================================================================
  // Mapping Functions
  // =============================================================================

  private mapSupabaseUserToAuth(user: Database['public']['Tables']['users']['Row']): AuthenticatedUser {
    return {
      id: user.id,
      name: user.display_name || '',
      email: user.email,
      role: user.role,
      avatar: user.photo_url || '',
      organizationId: user.organization_id,
      permissions: [], // TODO: Map permissions based on role
      isActive: user.is_active,
      lastLoginAt: user.last_login || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      emailVerified: true
    }
  }

  private mapSupabaseOrgToType(org: Database['public']['Tables']['organizations']['Row']): Organization {
    return {
      id: org.id,
      name: org.name,
      domain: org.domain || undefined,
      logo: org.logo || undefined,
      settings: org.settings as any || {},
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      ownerId: org.owner_id || '',
      isActive: org.is_active,
      plan: org.plan as any,
      maxUsers: org.max_users,
      currentUsers: org.current_users
    }
  }

  private mapSupabaseTicketToType(ticket: any): Ticket {
    return {
      id: parseInt(ticket.external_id),
      subject: ticket.subject,
      requester: ticket.requester_email,
      assignee: ticket.assignee_id,
      description: ticket.description,
      created_at: ticket.created_at,
      solved_at: ticket.solved_at,
      status: ticket.status,
      priority: ticket.priority,
      tags: ticket.tags || [],
      view: ticket.view || '',
      category: ticket.category || '',
      conversation: (ticket.conversations || []).map((conv: any) => ({
        sender: conv.sender_type === 'agent' ? 'agent' : 'customer',
        message: conv.body,
        timestamp: conv.created_at
      })),
      sla_breached: ticket.sla_breached,
      csat_score: ticket.satisfaction_rating
    }
  }

  private mapSupabaseInvitationToType(inv: Database['public']['Tables']['invitations']['Row']): UserInvitation {
    return {
      id: inv.id,
      email: inv.email,
      role: inv.role,
      organizationId: inv.organization_id,
      invitedBy: inv.invited_by,
      invitedAt: inv.created_at,
      expiresAt: inv.expires_at,
      status: inv.status as any,
      token: inv.token
    }
  }
}

export const databaseService = new DatabaseService()