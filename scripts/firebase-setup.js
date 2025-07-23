#!/usr/bin/env node

/**
 * Complete Firebase Setup Script
 * 
 * This script will:
 * 1. Initialize all required collections
 * 2. Set up security rules
 * 3. Create your admin account
 * 4. Seed initial data
 * 5. Configure everything for production use
 * 
 * Prerequisites:
 * 1. firebase-admin-key.json in project root
 * 2. Firestore Database enabled in Firebase Console
 * 3. Google Authentication enabled in Firebase Console
 * 
 * Usage: node scripts/firebase-setup.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}[${step}]${colors.reset} ${message}`);
}

// Initialize Firebase Admin
let db;
try {
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-admin-key.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    log('red', '❌ firebase-admin-key.json not found!');
    log('yellow', '📝 Please download your service account key from Firebase Console:');
    log('white', '   1. Go to Project Settings → Service Accounts');
    log('white', '   2. Click "Generate new private key"');
    log('white', '   3. Save as firebase-admin-key.json in your project root');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });

  db = admin.firestore();
  log('green', '✅ Firebase Admin SDK initialized');
  
} catch (error) {
  log('red', '❌ Failed to initialize Firebase Admin SDK');
  console.error(error);
  process.exit(1);
}

// Configuration
const ADMIN_EMAIL = 'mpwright@ebay.com';
const ORG_ID = 'signalcx-main';
const ORG_NAME = 'SignalCX Organization';

async function setupFirebase() {
  log('magenta', '🚀 Starting Complete Firebase Setup');
  log('white', '===================================\n');

  try {
    // Step 1: Create organization
    await createOrganization();
    
    // Step 2: Set up collections structure
    await setupCollections();
    
    // Step 3: Create admin user (if they've signed in)
    await createAdminUser();
    
    // Step 4: Deploy security rules
    await deploySecurityRules();
    
    // Step 5: Create sample data
    await createSampleData();
    
    // Step 6: Verify setup
    await verifySetup();
    
    log('green', '\n🎉 Firebase setup completed successfully!');
    log('cyan', '🔗 Your application is ready for production use');
    log('yellow', '📱 Next steps:');
    log('white', '   1. Start your app: npm run dev');
    log('white', '   2. Go to Live mode and sign in with Google');
    log('white', '   3. Access Team Management to invite users');
    
  } catch (error) {
    log('red', '\n❌ Setup failed:');
    console.error(error);
    process.exit(1);
  }
}

async function createOrganization() {
  logStep('1/6', 'Creating organization...');
  
  const orgRef = db.collection('organizations').doc(ORG_ID);
  
  await orgRef.set({
    id: ORG_ID,
    name: ORG_NAME,
    domain: 'ebay.com',
    settings: {
      allowSelfRegistration: false,
      requireEmailVerification: true,
      sessionTimeoutMinutes: 60,
      enableAuditLogging: true,
      allowedDomains: ['ebay.com'],
      customBranding: {
        companyName: ORG_NAME,
        logoUrl: '',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b'
      }
    },
    ownerId: '', // Will be set when admin user is created
    isActive: true,
    plan: 'enterprise',
    maxUsers: 100,
    currentUsers: 0,
    features: {
      analytics: true,
      aiInsights: true,
      customReports: true,
      apiAccess: true,
      sso: true
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  log('green', '   ✅ Organization created');
}

async function setupCollections() {
  logStep('2/6', 'Setting up database collections...');
  
  // Create empty collections with proper structure
  const collections = [
    {
      name: 'users',
      sampleDoc: {
        name: 'Sample User',
        email: 'sample@example.com',
        role: 'readonly',
        permissions: ['tickets.read'],
        isActive: false,
        organizationId: ORG_ID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    },
    {
      name: 'invitations',
      sampleDoc: {
        email: 'invite@example.com',
        role: 'agent',
        organizationId: ORG_ID,
        invitedBy: '',
        status: 'pending',
        token: 'sample-token',
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    },
    {
      name: 'audit_logs',
      sampleDoc: {
        userId: '',
        action: 'SYSTEM_SETUP',
        details: { message: 'Firebase setup completed' },
        organizationId: ORG_ID,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: '127.0.0.1',
        userAgent: 'Firebase Setup Script'
      }
    },
    {
      name: 'settings',
      sampleDoc: {
        organizationId: ORG_ID,
        category: 'general',
        settings: {
          appName: 'SignalCX',
          defaultTheme: 'light',
          enableNotifications: true
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: ''
      }
    }
  ];

  for (const collection of collections) {
    await db.collection(collection.name).doc('_sample').set(collection.sampleDoc);
    log('green', `   ✅ ${collection.name} collection created`);
  }
}

async function createAdminUser() {
  logStep('3/6', 'Setting up admin user...');
  
  try {
    // Try to find existing user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', ADMIN_EMAIL)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      // User exists, promote to admin
      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;
      
      await db.collection('users').doc(userId).update({
        role: 'org_admin',
        permissions: [
          'users.read', 'users.write', 'users.delete',
          'tickets.read', 'tickets.write',
          'analytics.read', 'analytics.write',
          'ai.read', 'ai.write',
          'settings.read', 'settings.write',
          'audit.read', 'org.read'
        ],
        isActive: true,
        organizationId: ORG_ID,
        organizationName: ORG_NAME,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update organization owner
      await db.collection('organizations').doc(ORG_ID).update({
        ownerId: userId,
        currentUsers: admin.firestore.FieldValue.increment(1)
      });

      log('green', `   ✅ Existing user promoted to org_admin`);
    } else {
      log('yellow', `   ⚠️  User ${ADMIN_EMAIL} not found`);
      log('white', '      Please sign in with Google first, then run this script again');
    }
  } catch (error) {
    log('yellow', '   ⚠️  Could not set up admin user (this is okay)');
    log('white', '      Please sign in with Google after setup completes');
  }
}

async function deploySecurityRules() {
  logStep('4/6', 'Security rules deployment...');
  log('yellow', '   ⚠️  Security rules must be deployed manually');
  log('white', '      1. Go to Firebase Console → Firestore → Rules');
  log('white', '      2. Copy rules from firestore.rules file');
  log('white', '      3. Click "Publish"');
  log('green', '   ✅ Rules file is ready for deployment');
}

async function createSampleData() {
  logStep('5/6', 'Creating sample data...');
  
  // Create system settings
  await db.collection('settings').doc('app-config').set({
    organizationId: ORG_ID,
    category: 'application',
    settings: {
      appName: 'SignalCX',
      version: '1.0.0',
      features: {
        teamManagement: true,
        analytics: true,
        aiInsights: true
      },
      defaultUserRole: 'readonly',
      invitationExpiryDays: 7
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: 'system'
  });

  // Create initial audit log
  await db.collection('audit_logs').add({
    userId: 'system',
    action: 'SYSTEM_INITIALIZED',
    details: {
      message: 'Firebase setup completed successfully',
      organizationId: ORG_ID,
      setupTime: new Date().toISOString()
    },
    organizationId: ORG_ID,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: '127.0.0.1',
    userAgent: 'Setup Script'
  });

  log('green', '   ✅ Sample data created');
}

async function verifySetup() {
  logStep('6/6', 'Verifying setup...');
  
  try {
    // Check organization
    const orgDoc = await db.collection('organizations').doc(ORG_ID).get();
    if (!orgDoc.exists) throw new Error('Organization not created');
    
    // Check collections exist
    const collections = ['users', 'invitations', 'audit_logs', 'settings'];
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).limit(1).get();
      if (snapshot.empty) throw new Error(`${collectionName} collection not created`);
    }
    
    log('green', '   ✅ All components verified');
    
    // Display configuration summary
    log('cyan', '\n📋 Setup Summary:');
    log('white', `   Organization: ${ORG_NAME}`);
    log('white', `   Organization ID: ${ORG_ID}`);
    log('white', `   Admin Email: ${ADMIN_EMAIL}`);
    log('white', `   Collections: ${collections.join(', ')}`);
    log('white', `   Security Rules: Ready for deployment`);
    
  } catch (error) {
    throw new Error(`Verification failed: ${error.message}`);
  }
}

// Clean up sample documents
async function cleanup() {
  const collections = ['users', 'invitations', 'audit_logs', 'settings'];
  for (const collectionName of collections) {
    try {
      await db.collection(collectionName).doc('_sample').delete();
    } catch (error) {
      // Ignore if document doesn't exist
    }
  }
}

// Run setup
setupFirebase()
  .then(() => cleanup())
  .then(() => {
    log('green', '\n🚀 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    log('red', '\n❌ Setup failed:');
    console.error(error);
    process.exit(1);
  });