#!/usr/bin/env node

/**
 * Add First Admin Script
 * 
 * This script adds your Google account as the first org_admin.
 * Run this AFTER you've signed in with Google at least once.
 * 
 * Usage: node scripts/add-first-admin.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with your service account
// You'll need to download the service account key from Firebase Console
try {
  const serviceAccount = require('../firebase-admin-key.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });
} catch (error) {
  console.error('❌ Could not load firebase-admin-key.json');
  console.log('📝 To get this file:');
  console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save as firebase-admin-key.json in your project root');
  process.exit(1);
}

const db = admin.firestore();

async function addFirstAdmin() {
  const adminEmail = 'mpwright@ebay.com'; // Your email
  
  console.log('🚀 Adding first admin user...\n');
  
  try {
    // Step 1: Find your user account by email
    console.log('🔍 Looking for user account...');
    const usersSnapshot = await db.collection('users')
      .where('email', '==', adminEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('❌ User not found!');
      console.log('📝 Please sign in with Google first at your application.');
      console.log('   Go to your app → Live mode → Sign in with Google');
      console.log('   Then run this script again.');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log('✅ Found user:', userData.email);

    // Step 2: Create organization if it doesn't exist
    console.log('🏢 Setting up organization...');
    const orgId = 'signalcx-main';
    const orgRef = db.collection('organizations').doc(orgId);
    
    await orgRef.set({
      id: orgId,
      name: 'SignalCX Organization',
      domain: 'ebay.com',
      settings: {
        allowSelfRegistration: false,
        requireEmailVerification: true,
        sessionTimeoutMinutes: 60,
        enableAuditLogging: true,
        allowedDomains: ['ebay.com'],
        customBranding: {
          companyName: 'SignalCX'
        }
      },
      ownerId: userId,
      isActive: true,
      plan: 'enterprise',
      maxUsers: 100,
      currentUsers: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log('✅ Organization created/updated');

    // Step 3: Update user to org_admin
    console.log('👑 Promoting user to org_admin...');
    await db.collection('users').doc(userId).update({
      role: 'org_admin',
      permissions: [
        'users.read', 'users.write', 'users.delete',
        'tickets.read', 'tickets.write',
        'analytics.read', 'analytics.write',
        'ai.read', 'ai.write',
        'settings.read', 'settings.write',
        'audit.read',
        'org.read'
      ],
      isActive: true,
      organizationId: orgId,
      organizationName: 'SignalCX Organization',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ User promoted to org_admin');
    console.log('\n🎉 Setup complete!');
    console.log('🔗 You can now access Team Management in your app');
    console.log('📧 You can now invite other users via the Team Management interface');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    process.exit(0);
  }
}

addFirstAdmin();