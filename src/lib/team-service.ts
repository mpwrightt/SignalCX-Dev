/**
 * Team Management Service - Production Ready
 * Handles all team member and invitation operations with Firebase
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase-config';
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
    const error = await response.json();
    console.error('Email API Error Response:', error);
    throw new Error(`Email API Error: ${error.error || 'Failed to send invitation email'}${error.details ? ` - ${error.details}` : ''}`);
  }

  return response.json();
}

// Generate secure invitation token
function generateInvitationToken(): string {
  return btoa(crypto.randomUUID() + Date.now()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

/**
 * Get all team members for an organization
 */
export async function getTeamMembers(organizationId: string): Promise<AuthenticatedUser[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('organizationId', '==', organizationId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const members: AuthenticatedUser[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      members.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar || 'https://placehold.co/32x32.png',
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        department: data.department,
        permissions: data.permissions || getRolePermissions(data.role),
        isActive: data.isActive ?? true,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        invitedBy: data.invitedBy,
        emailVerified: data.emailVerified ?? false,
      });
    });
    
    return members;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw new Error('Failed to load team members');
  }
}

/**
 * Get all pending invitations for an organization
 */
export async function getInvitations(organizationId: string): Promise<UserInvitation[]> {
  try {
    const invitationsRef = collection(db, 'invitations');
    const q = query(
      invitationsRef,
      where('organizationId', '==', organizationId),
      orderBy('invitedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const invitations: UserInvitation[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      invitations.push({
        id: doc.id,
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        invitedBy: data.invitedBy,
        inviterName: data.inviterName,
        invitedAt: data.invitedAt?.toDate?.()?.toISOString() || data.invitedAt,
        status: data.status,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
        token: data.token,
      });
    });
    
    return invitations;
  } catch (error) {
    console.error('Error fetching invitations:', error);
    throw new Error('Failed to load invitations');
  }
}

/**
 * Invite a new team member
 */
export async function inviteTeamMember(
  email: string,
  role: UserRole,
  organizationId: string,
  organizationName: string,
  invitedBy: string,
  inviterName?: string
): Promise<void> {
  try {
    // Check if user already exists
    const usersRef = collection(db, 'users');
    const existingUserQuery = query(usersRef, where('email', '==', email));
    const existingUsers = await getDocs(existingUserQuery);
    
    if (!existingUsers.empty) {
      throw new Error('User with this email already exists');
    }
    
    // Check if invitation already exists
    const invitationsRef = collection(db, 'invitations');
    const existingInviteQuery = query(
      invitationsRef,
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    const existingInvites = await getDocs(existingInviteQuery);
    
    if (!existingInvites.empty) {
      throw new Error('Pending invitation already exists for this email');
    }
    
    // Create invitation
    const invitation: Omit<UserInvitation, 'id'> = {
      email,
      role,
      organizationId,
      organizationName,
      invitedBy,
      inviterName,
      invitedAt: new Date().toISOString(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      token: generateInvitationToken(),
    };
    
    const docRef = await addDoc(invitationsRef, {
      ...invitation,
      invitedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    
    // Send invitation email
    try {
      await sendInvitationEmail({
        email,
        organizationName,
        role,
        inviterName: inviterName || invitedBy,
        token: invitation.token,
      });
      console.log('Invitation email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't throw here - the invitation is still created even if email fails
    }
    
  } catch (error) {
    console.error('Error inviting team member:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send invitation');
  }
}

/**
 * Update team member role and status
 */
export async function updateTeamMember(
  userId: string,
  updates: Partial<Pick<AuthenticatedUser, 'role' | 'isActive' | 'department'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    
    // If role is being updated, update permissions too
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    
    if (updates.role) {
      updateData.permissions = getRolePermissions(updates.role);
    }
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating team member:', error);
    throw new Error('Failed to update team member');
  }
}

/**
 * Deactivate team member
 */
export async function deactivateTeamMember(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deactivating team member:', error);
    throw new Error('Failed to deactivate team member');
  }
}

/**
 * Reactivate team member
 */
export async function reactivateTeamMember(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error reactivating team member:', error);
    throw new Error('Failed to reactivate team member');
  }
}

/**
 * Revoke invitation
 */
export async function revokeInvitation(invitationId: string): Promise<void> {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    await updateDoc(invitationRef, {
      status: 'revoked',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    throw new Error('Failed to revoke invitation');
  }
}

/**
 * Resend invitation
 */
export async function resendInvitation(invitationId: string): Promise<void> {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }
    
    const newToken = generateInvitationToken();
    
    // Update expiration date and generate new token
    await updateDoc(invitationRef, {
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: newToken,
      updatedAt: serverTimestamp(),
    });
    
    // Send new invitation email
    const invitationData = invitationDoc.data();
    try {
      await sendInvitationEmail({
        email: invitationData.email,
        organizationName: invitationData.organizationName || 'Your Organization',
        role: invitationData.role,
        inviterName: invitationData.inviterName || invitationData.invitedBy,
        token: newToken,
      });
      console.log('Invitation email resent successfully to:', invitationData.email);
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError);
      // Don't throw here - the invitation is still updated even if email fails
    }
    
  } catch (error) {
    console.error('Error resending invitation:', error);
    throw new Error('Failed to resend invitation');
  }
}

/**
 * Delete invitation
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    await deleteDoc(invitationRef);
  } catch (error) {
    console.error('Error deleting invitation:', error);
    throw new Error('Failed to delete invitation');
  }
}