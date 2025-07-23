#!/usr/bin/env node

/**
 * Bootstrap Admin Script
 * 
 * This script creates the first organization admin user.
 * Run this once after setting up Firebase to create your admin account.
 * 
 * Usage: node scripts/bootstrap-admin.js your-email@company.com
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-admin-key.json'); // You'll need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function bootstrapAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/bootstrap-admin.js your-email@company.com');
    process.exit(1);
  }

  console.log('🚀 SignalCX Admin Bootstrap\n');
  console.log(`Setting up admin for: ${email}`);
  
  // Ask for confirmation
  const answer = await new Promise(resolve => {
    rl.question('Continue? (y/N): ', resolve);
  });
  
  if (answer.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    process.exit(0);
  }

  try {
    // Step 1: Create organization
    const orgId = 'org-' + Date.now();
    const organizationData = {
      id: orgId,
      name: 'SignalCX Organization',
      domain: email.split('@')[1] || 'company.com',
      settings: {
        allowSelfRegistration: false,
        requireEmailVerification: true,
        sessionTimeoutMinutes: 60,
        enableAuditLogging: true,
        allowedDomains: [email.split('@')[1] || 'company.com'],
        customBranding: {
          companyName: 'SignalCX Organization'
        }
      },
      ownerId: '', // Will be set after user creation
      isActive: true,
      plan: 'pro',
      maxUsers: 100,
      currentUsers: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('organizations').doc(orgId).set(organizationData);
    console.log('✅ Organization created');

    // Step 2: Create user record (they'll need to sign in with Google first)
    console.log('\n📝 User Setup Instructions:');
    console.log('1. Go to your app in Enterprise mode');
    console.log('2. Sign in with Google using:', email);
    console.log('3. Run this command again with --promote flag');
    console.log('\nOr use: node scripts/bootstrap-admin.js --promote', email);

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

async function promoteToAdmin() {
  const email = process.argv[3];
  
  if (!email) {
    console.error('❌ Please provide an email address');
    process.exit(1);
  }

  try {
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('❌ User not found. Please sign in with Google first.');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Update user to org_admin
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
      organizationId: 'org-' + Date.now(), // You might need to adjust this
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ User promoted to org_admin:', email);
    console.log('✅ You can now access Team Management in the app!');

  } catch (error) {
    console.error('❌ Error promoting user:', error);
  }
}

// Check for promote flag
if (process.argv[2] === '--promote') {
  promoteToAdmin();
} else {
  bootstrapAdmin();
}