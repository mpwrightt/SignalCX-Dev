

import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, googleProvider, db, enableFirebaseNetwork } from './firebase-config';
import type { AuthenticatedUser, Organization, UserRole, UserInvitation } from './types';
import { getRolePermissions } from './rbac-service';

// Demo mode users (kept for backward compatibility)
const demoUsers: AuthenticatedUser[] = [
  {
    id: 'demo-1',
    name: 'Sarah Connor',
    email: 'manager@demo.com',
    role: 'manager',
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
    avatar: 'https://placehold.co/32x32.png',
    permissions: getRolePermissions('agent'),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    emailVerified: true,
  },
];

/**
 * Sign in with Google (Enterprise Mode)
 */
export async function signInWithGoogle(): Promise<{ user: AuthenticatedUser | null, error?: string }> {
  try {
    // Ensure Firebase network is enabled
    await enableFirebaseNetwork();
    
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    if (!firebaseUser) {
      return { user: null, error: 'Authentication failed' };
    }

    // Get or create user profile in Firestore
    const user = await getOrCreateUserProfile(firebaseUser);
    
    if (!user) {
      return { user: null, error: 'Failed to create user profile' };
    }

    // Update last login
    await updateLastLogin(user.id);
    
    return { user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { user: null, error: error instanceof Error ? error.message : 'Authentication failed' };
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Demo mode login (for development/testing)
 */
export async function loginDemo(email: string): Promise<{ user: AuthenticatedUser | null, reason?: string }> {
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const user = demoUsers.find((u) => u.email === email);
  
  if (!user) {
    return { user: null, reason: 'USER_NOT_FOUND' };
  }
  
  return { user };
}

/**
 * Get user by ID from Firestore
 */
export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  try {
    // Check demo users first
    const demoUser = demoUsers.find(u => u.id === id);
    if (demoUser) {
      return demoUser;
    }

    // Get from Firestore
    const userDoc = await getDoc(doc(db, 'users', id));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    return {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatar: userData.avatar || userData.photoURL || 'https://placehold.co/32x32.png',
      organizationId: userData.organizationId,
      organizationName: userData.organizationName,
      department: userData.department,
      permissions: userData.permissions || getRolePermissions(userData.role),
      isActive: userData.isActive ?? true,
      lastLoginAt: userData.lastLoginAt?.toDate?.()?.toISOString(),
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      invitedBy: userData.invitedBy,
      emailVerified: userData.emailVerified ?? false,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get or create user profile in Firestore
 */
async function getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<AuthenticatedUser | null> {
  try {
    // Ensure Firebase network is enabled
    await enableFirebaseNetwork();
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // User exists, return profile
      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        name: userData.name || firebaseUser.displayName || 'Unknown',
        email: firebaseUser.email || '',
        role: userData.role || 'readonly',
        avatar: userData.avatar || firebaseUser.photoURL || 'https://placehold.co/32x32.png',
        organizationId: userData.organizationId,
        organizationName: userData.organizationName,
        department: userData.department,
        permissions: userData.permissions || getRolePermissions(userData.role || 'readonly'),
        isActive: userData.isActive ?? false, // New users inactive by default
        lastLoginAt: userData.lastLoginAt?.toDate?.()?.toISOString(),
        createdAt: userData.createdAt?.toDate?.()?.toISOString(),
        updatedAt: userData.updatedAt?.toDate?.()?.toISOString(),
        invitedBy: userData.invitedBy,
        emailVerified: firebaseUser.emailVerified,
      };
    } else {
      // Check if user has a pending invitation
      const invitation = await checkPendingInvitation(firebaseUser.email || '');
      
      // Check for bootstrap admin (temporary - remove in production)
      const bootstrapAdminEmail = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL;
      const isBootstrapAdmin = bootstrapAdminEmail && firebaseUser.email === bootstrapAdminEmail;
      
      // Create new user profile
      const role: UserRole = isBootstrapAdmin ? 'org_admin' : (invitation?.role || 'readonly');
      
      // Set organization for bootstrap admin
      const organizationId = isBootstrapAdmin ? 'signalcx-main' : invitation?.organizationId;
      const organizationName = isBootstrapAdmin ? 'SignalCX Organization' : invitation?.organizationName;
      
      const newUser: Partial<AuthenticatedUser> = {
        name: firebaseUser.displayName || 'Unknown',
        email: firebaseUser.email || '',
        role,
        avatar: firebaseUser.photoURL || 'https://placehold.co/32x32.png',
        organizationId,
        organizationName,
        permissions: getRolePermissions(role),
        isActive: !!invitation || isBootstrapAdmin, // Active if invited or bootstrap admin
        emailVerified: !!firebaseUser.emailVerified,
        invitedBy: invitation?.invitedBy,
      };
      
      // Clean undefined values before saving to Firestore
      const cleanUserData = Object.fromEntries(
        Object.entries(newUser).filter(([_, value]) => value !== undefined)
      );
      
      await setDoc(userRef, {
        ...cleanUserData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Mark invitation as accepted if exists
      if (invitation) {
        await updateInvitationStatus(invitation.id, 'accepted');
      }
      
      return {
        id: firebaseUser.uid,
        ...newUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as AuthenticatedUser;
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    
    // Handle offline scenarios
    if (error instanceof Error && error.message.includes('client is offline')) {
      console.warn('Firebase is offline, falling back to bootstrap admin if applicable');
      
      // If this is the bootstrap admin, create a temporary profile
      const bootstrapAdminEmail = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL;
      if (bootstrapAdminEmail && firebaseUser.email === bootstrapAdminEmail) {
        return {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Bootstrap Admin',
          email: firebaseUser.email || '',
          role: 'org_admin',
          avatar: firebaseUser.photoURL || 'https://placehold.co/32x32.png',
          permissions: getRolePermissions('org_admin'),
          isActive: true,
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }
    
    return null;
  }
}

/**
 * Check for pending invitation
 */
async function checkPendingInvitation(email: string): Promise<(UserInvitation & { id: string }) | null> {
  try {
    const invitationsRef = collection(db, 'invitations');
    const q = query(
      invitationsRef,
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UserInvitation & { id: string };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking invitation:', error);
    return null;
  }
}

/**
 * Update invitation status
 */
async function updateInvitationStatus(invitationId: string, status: 'accepted' | 'expired' | 'revoked') {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    await updateDoc(invitationRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating invitation:', error);
  }
}

/**
 * Update user's last login time
 */
async function updateLastLogin(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentFirebaseUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Set up auth state listener
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
