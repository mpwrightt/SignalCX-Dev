import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Support both Next.js and Node.js environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]'
  })
  throw new Error('Missing Supabase environment variables')
}

// Global client instances (singleton pattern)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    // Server-side: return the regular client
    return supabase
  }
  
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}


export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          domain: string | null
          logo: string | null
          plan: 'free' | 'pro' | 'enterprise'
          max_users: number
          current_users: number
          is_active: boolean
          owner_id: string | null
          settings: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          settings?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          settings?: Record<string, any> | null
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          photo_url: string | null
          role: 'readonly' | 'agent' | 'manager' | 'org_admin' | 'super_admin'
          organization_id: string
          is_active: boolean
          email_verified: boolean | null
          firebase_uid: string | null
          invited_by: string | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          photo_url?: string | null
          role?: 'readonly' | 'agent' | 'manager' | 'org_admin' | 'super_admin'
          organization_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          display_name?: string | null
          photo_url?: string | null
          role?: 'readonly' | 'agent' | 'manager' | 'org_admin' | 'super_admin'
          organization_id?: string
          is_active?: boolean
          updated_at?: string
          last_login?: string | null
        }
      }
      tickets: {
        Row: {
          id: string
          organization_id: string
          external_id: string
          subject: string
          description: string
          priority: 'low' | 'normal' | 'high' | 'urgent'
          status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed'
          assignee_id: string | null
          requester_email: string
          created_at: string
          updated_at: string
          solved_at: string | null
          tags: string[] | null
          custom_fields: Record<string, any> | null
          satisfaction_rating: number | null
        }
        Insert: {
          id?: string
          organization_id: string
          external_id: string
          subject: string
          description: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          status?: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed'
          assignee_id?: string | null
          requester_email: string
          created_at?: string
          updated_at?: string
          solved_at?: string | null
          tags?: string[] | null
          custom_fields?: Record<string, any> | null
          satisfaction_rating?: number | null
        }
        Update: {
          subject?: string
          description?: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          status?: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed'
          assignee_id?: string | null
          updated_at?: string
          solved_at?: string | null
          tags?: string[] | null
          custom_fields?: Record<string, any> | null
          satisfaction_rating?: number | null
        }
      }
      conversations: {
        Row: {
          id: string
          ticket_id: string
          author_id: string
          body: string
          is_public: boolean
          created_at: string
          attachments: Record<string, any>[] | null
        }
        Insert: {
          id?: string
          ticket_id: string
          author_id: string
          body: string
          is_public?: boolean
          created_at?: string
          attachments?: Record<string, any>[] | null
        }
        Update: {
          body?: string
          is_public?: boolean
          attachments?: Record<string, any>[] | null
        }
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: 'readonly' | 'agent' | 'manager' | 'org_admin' | 'super_admin'
          token: string
          expires_at: string
          invited_by: string
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          accepted_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role: 'readonly' | 'agent' | 'manager' | 'org_admin' | 'super_admin'
          token: string
          expires_at: string
          invited_by: string
          accepted_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          accepted_at?: string | null
          revoked_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'readonly' | 'agent' | 'manager' | 'org_admin' | 'super_admin'
      ticket_priority: 'low' | 'normal' | 'high' | 'urgent'
      ticket_status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed'
    }
  }
}