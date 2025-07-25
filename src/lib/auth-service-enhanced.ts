import { createSupabaseBrowserClient } from './supabase-config'
import { supabaseService } from './supabase-service'
import type { AuthenticatedUser, UserRole, UserInvitation } from './types'
import { getRolePermissions } from './rbac-service'

/**
 * Create a user profile from Supabase auth user
 */
async function createUserFromSupabaseAuth(supabaseUser: any): Promise<AuthenticatedUser | null> {
  try {
    // Validate email exists and is properly formatted
    if (!supabaseUser.email) {
      console.error('[Auth] Supabase user missing email:', supabaseUser)
      return null
    }
    
    // Basic email format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(supabaseUser.email)) {
      console.error('[Auth] Invalid email format:', supabaseUser.email)
      return null
    }
    
    const isBootstrapAdmin = supabaseUser.email === process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL
    const role: UserRole = isBootstrapAdmin ? 'org_admin' : 'readonly'
    
    const newUser: Partial<AuthenticatedUser> = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
      avatar: supabaseUser.user_metadata?.avatar_url || '',
      role,
      organizationId: '00000000-0000-0000-0000-000000000001', // Default organization
      permissions: getRolePermissions(role),
      isActive: true,
      emailVerified: !!supabaseUser.email_confirmed_at,
      firebaseUid: undefined
    }

    // Create user via Supabase service
    const result = await supabaseService.createUser(newUser)
    
    if (result.success) {
      // Return the created user
      const { data: createdUser } = await supabaseService.getUser(supabaseUser.id)
      return createdUser
    }
    
    return null
  } catch (error) {
    console.error('[Auth] Failed to create user from Supabase auth:', error)
    return null
  }
}

// Demo mode users (kept for backward compatibility)
const demoUsers: AuthenticatedUser[] = [
  {
    id: 'demo-1',
    name: 'Sarah Connor',
    email: 'manager@demo.com',
    role: 'manager',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationName: 'Demo Organization',
    avatar: 'https://placehold.co/32x32.png',
    permissions: getRolePermissions('manager'),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    emailVerified: true,
  },
  {
    id: 'demo-2',
    name: 'John Reese',
    email: 'agent@demo.com',
    role: 'agent',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationName: 'Demo Organization',
    avatar: 'https://placehold.co/32x32.png',
    permissions: getRolePermissions('agent'),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    emailVerified: true,
  },
]

/**
 * Sign in with Google - Supabase OAuth
 */
export async function signInWithGoogle(): Promise<{ user: AuthenticatedUser | null, error?: string }> {
  try {
    const supabase = createSupabaseBrowserClient()
    
    // Supabase OAuth with Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    })

    if (error) {
      return { user: null, error: error.message }
    }

    // User will be redirected to Google OAuth
    // The actual user data will be available after redirect
    return { user: null }
  } catch (error) {
    console.error('Google sign-in error:', error)
    return { user: null, error: error instanceof Error ? error.message : 'Authentication failed' }
  }
}

/**
 * Sign out - Supabase
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

/**
 * Get current authenticated user - Supabase
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Get user profile from database
    const { data: userProfile } = await supabaseService.getUser(user.id)
    return userProfile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Demo mode login (simplified for Supabase mode)
 */
export async function loginDemo(email: string): Promise<{ user: AuthenticatedUser | null, reason?: string }> {
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  
  const demoUser = demoUsers.find((u) => u.email === email)
  
  if (!demoUser) {
    return { user: null, reason: 'USER_NOT_FOUND' }
  }

  try {
    // For Supabase demo mode, just return the demo user without creating database records
    // This avoids database constraint issues in demo mode
    console.log('[Auth] Demo mode - returning demo user without database creation')
    return { user: demoUser }
  } catch (error) {
    console.error('[Auth] Demo login failed:', error)
    
    // Fallback to original demo behavior
    console.warn('[Auth] Falling back to localStorage-only demo mode')
    return { user: demoUser }
  }
}

/**
 * Get user by ID - enhanced for demo users and Supabase
 */
export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  try {
    // Check demo users first
    const demoUser = demoUsers.find(u => u.id === id)
    if (demoUser) {
      return demoUser
    }

    // Use database service for Supabase users
    const { data: user, error } = await supabaseService.getUser(id)
    
    if (error) {
      console.error('Error getting user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Check for pending invitation - Supabase only
 */
async function checkPendingInvitation(email: string): Promise<(UserInvitation & { id: string }) | null> {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }

    return { id: data.id, ...data } as UserInvitation & { id: string }
  } catch (error) {
    console.error('Error checking invitation:', error)
    return null
  }
}

/**
 * Update invitation status - Supabase only
 */
async function updateInvitationStatus(invitationId: string, status: 'accepted' | 'expired' | 'revoked') {
  try {
    const invitation = { status, invitedAt: status === 'accepted' ? new Date().toISOString() : undefined }
    const result = await supabaseService.updateInvitation(invitationId, invitation)
    
    if (!result.success) {
      console.error('Error updating invitation:', result)
    }
  } catch (error) {
    console.error('Error updating invitation:', error)
  }
}

/**
 * Update user's last login time - Supabase only
 */
async function updateLastLogin(userId: string) {
  try {
    const updates = { lastLoginAt: new Date().toISOString() }
    const result = await supabaseService.updateUser(userId, updates)
    
    if (!result.success) {
      console.error('Error updating last login:', result)
    }
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

/**
 * Set up auth state listener - Supabase only
 */
export function onAuthStateChange(callback: (user: AuthenticatedUser | null) => void): () => void {
  const supabase = createSupabaseBrowserClient()
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      // Use a non-async approach to avoid blocking the callback
      const processUser = async () => {
        try {
          // Try to get existing user profile
          const { data: userProfile, error: getUserError } = await supabaseService.getUser(session.user.id)
          
          if (userProfile) {
            callback(userProfile)
          } else {
            // Create new user profile if it doesn't exist
            const newUser = await createUserFromSupabaseAuth(session.user)
            callback(newUser)
          }
        } catch (error) {
          console.error('[Auth] Error processing user:', error)
          callback(null)
        }
      };
      
      // Don't await this - let it run in the background
      processUser();
    } else {
      callback(null)
    }
  })

  return () => subscription.unsubscribe()
}

/**
 * Enhanced user profile creation/retrieval - Supabase only
 */
async function getOrCreateUserProfile(supabaseUser: any): Promise<AuthenticatedUser | null> {
  try {
    // Check if user already exists
    const existingUser = await getUserById(supabaseUser.id)
    if (existingUser) {
      return existingUser
    }

    // Check for pending invitation
    const invitation = await checkPendingInvitation(supabaseUser.email || '')
    
    // Check for bootstrap admin
    const bootstrapAdminEmail = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL
    const isBootstrapAdmin = bootstrapAdminEmail && supabaseUser.email === bootstrapAdminEmail
    
    // Create new user profile
    const role: UserRole = isBootstrapAdmin ? 'org_admin' : (invitation?.role || 'readonly')
    const organizationId = isBootstrapAdmin ? 'signalcx-main' : invitation?.organizationId
    const organizationName = isBootstrapAdmin ? 'SignalCX Organization' : invitation?.organizationName
    
    const newUser: Partial<AuthenticatedUser> = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'Unknown',
      email: supabaseUser.email || '',
      role,
      avatar: supabaseUser.user_metadata?.avatar_url || 'https://placehold.co/32x32.png',
      organizationId,
      organizationName,
      permissions: getRolePermissions(role),
      isActive: !!invitation || isBootstrapAdmin,
      emailVerified: supabaseUser.email_confirmed_at ? true : false,
      invitedBy: invitation?.invitedBy,
      firebaseUid: undefined
    }
    
    // Use Supabase service to create user
    const result = await supabaseService.createUser(newUser)
    
    if (!result.success) {
      console.error('Failed to create user profile:', result)
      return null
    }
    
    // Mark invitation as accepted if exists
    if (invitation) {
      await updateInvitationStatus(invitation.id, 'accepted')
    }
    
    return newUser as AuthenticatedUser
  } catch (error) {
    console.error('Error creating user profile:', error)
    
    // Handle offline scenarios for bootstrap admin
    if (error instanceof Error && error.message.includes('offline')) {
      const bootstrapAdminEmail = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL
      if (bootstrapAdminEmail && supabaseUser.email === bootstrapAdminEmail) {
        return {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || 'Bootstrap Admin',
          email: supabaseUser.email || '',
          role: 'org_admin',
          avatar: supabaseUser.user_metadata?.avatar_url || 'https://placehold.co/32x32.png',
          permissions: getRolePermissions('org_admin'),
          isActive: true,
          emailVerified: !!supabaseUser.email_confirmed_at,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    }
    
    return null
  }
}

/**
 * Migration health check - Supabase only
 */
export async function authHealthCheck(): Promise<{
  supabase: boolean
}> {
  const healthCheck = await supabaseService.healthCheck()
  return {
    supabase: healthCheck.supabase
  }
}