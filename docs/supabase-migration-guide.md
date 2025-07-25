# Firebase to Supabase Migration Guide

This guide provides step-by-step instructions for migrating SignalCX from Firebase to Supabase with zero downtime using the dual-write strategy.

## Overview

- **Timeline**: 2-3 weeks
- **Risk Level**: Medium
- **Downtime**: 2-4 hours for production cutover
- **Strategy**: Dual-write migration with gradual rollout

## Prerequisites

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project named "SignalCX"
2. Note down your project URL and anon key from the API settings
3. Get your service role key for database administration

### 2. Environment Configuration

Add the following to your `.env` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Migration Flags
NEXT_PUBLIC_USE_SUPABASE=false
NEXT_PUBLIC_DUAL_WRITE_ENABLED=false
```

## Phase 1: Database Setup

### 1. Apply Database Schema

1. Copy the contents of `supabase/migrations/001_initial_schema.sql`
2. Run it in your Supabase SQL editor to create all tables and indexes
3. Copy the contents of `supabase/migrations/002_row_level_security.sql`
4. Run it to set up Row Level Security policies

### 2. Verify Schema

Check that all tables were created successfully:
- organizations
- users
- tickets
- conversations
- invitations
- audit_logs
- agent_performance
- ticket_analyses

## Phase 2: Data Migration

### 1. Run Migration Script

```bash
npm run migrate:supabase
```

This script will:
- Migrate all data from Firebase to Supabase
- Show progress for each collection
- Report any errors encountered
- Provide a detailed summary

### 2. Validate Migration

```bash
npm run validate:migration
```

This script will:
- Compare record counts between Firebase and Supabase
- Check for missing records
- Identify data inconsistencies
- Provide a validation report

### 3. Fix Any Issues

If validation finds problems:
1. Review the error messages
2. Fix data issues manually in Supabase
3. Re-run specific parts of the migration if needed
4. Validate again until all issues are resolved

## Phase 3: Dual-Write Setup

### 1. Enable Dual-Write Mode

```bash
# In your .env file
NEXT_PUBLIC_DUAL_WRITE_ENABLED=true
```

This enables writing to both Firebase and Supabase simultaneously.

### 2. Test Application

1. Start your development servers:
   ```bash
   npm run dev
   npm run genkit:dev
   ```

2. Test all major functionality:
   - User authentication
   - Ticket management
   - Team management
   - AI analytics
   - Settings management

### 3. Monitor Dual-Write

Watch for any dual-write errors in your logs. The system will:
- Continue operating if one database fails
- Log detailed error information
- Maintain data consistency

## Phase 4: Production Cutover

### 1. Pre-Cutover Checklist

- [ ] All data successfully migrated and validated
- [ ] Dual-write mode tested and stable
- [ ] Team notified of maintenance window
- [ ] Rollback procedures documented
- [ ] Monitoring dashboard ready

### 2. Cutover Process

1. **Enable Supabase Mode**:
   ```bash
   NEXT_PUBLIC_USE_SUPABASE=true
   ```

2. **Test Core Functionality**:
   - Authentication flow
   - Data reads and writes
   - Real-time features
   - Performance metrics

3. **Monitor Application**:
   - Error rates
   - Response times
   - User experience
   - Data consistency

### 3. Post-Cutover Validation

1. Run comprehensive tests
2. Monitor for 48 hours
3. Collect user feedback
4. Performance optimization if needed

## Phase 5: Cleanup

### 1. Disable Dual-Write

Once stable on Supabase:

```bash
NEXT_PUBLIC_DUAL_WRITE_ENABLED=false
```

### 2. Firebase Cleanup

1. Set Firebase to read-only mode
2. Archive Firebase data
3. Remove Firebase dependencies (optional)
4. Update documentation

## Environment Variables Reference

### Required for Migration

```bash
# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Supabase (new)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Migration Control
NEXT_PUBLIC_USE_SUPABASE=false|true
NEXT_PUBLIC_DUAL_WRITE_ENABLED=false|true
```

## Troubleshooting

### Common Issues

1. **Migration Script Fails**
   - Check network connectivity
   - Verify environment variables
   - Check Supabase service status
   - Review error logs for specific issues

2. **Data Validation Errors**
   - Compare timestamps (Firebase vs Supabase format)
   - Check for null/undefined values
   - Verify foreign key relationships
   - Review data type mappings

3. **Authentication Issues**
   - Configure OAuth providers in Supabase
   - Set up redirect URLs
   - Verify RLS policies
   - Check user roles and permissions

4. **Performance Problems**
   - Review database indexes
   - Optimize queries
   - Check connection pooling
   - Monitor resource usage

### Rollback Procedure

If issues arise during cutover:

1. **Immediate Rollback**:
   ```bash
   NEXT_PUBLIC_USE_SUPABASE=false
   ```

2. **Verify Firebase Functionality**
3. **Investigate Issues**
4. **Plan Next Attempt**

## Success Metrics

### Technical KPIs

- [ ] Zero data loss during migration
- [ ] <200ms average response time improvement
- [ ] 99.9% uptime during cutover
- [ ] All tests passing post-migration

### Business KPIs

- [ ] No customer-facing issues
- [ ] Maintain current feature functionality
- [ ] Team productivity maintained
- [ ] Cost optimization achieved

## Support

For issues during migration:

1. Check the migration logs
2. Review the validation report
3. Consult the troubleshooting section
4. Contact the development team

## Next Steps

After successful migration:

1. **Monitor Performance**: Track response times and error rates
2. **User Training**: Update team on any changes
3. **Documentation**: Update system documentation
4. **Optimization**: Fine-tune performance based on usage patterns
5. **Cost Analysis**: Compare costs between Firebase and Supabase

## Files Modified/Created

### Configuration
- `src/lib/supabase-config.ts` - Supabase client configuration
- `src/lib/database-service.ts` - Database abstraction layer
- `src/lib/dual-write-manager.ts` - Dual-write management
- `src/lib/auth-service-enhanced.ts` - Enhanced authentication

### Database
- `supabase/migrations/001_initial_schema.sql` - Database schema
- `supabase/migrations/002_row_level_security.sql` - RLS policies

### Scripts
- `scripts/migrate-firebase-to-supabase.ts` - Data migration
- `scripts/validate-migration.ts` - Migration validation

### Environment
- `.env` - Updated with Supabase variables
- `package.json` - Added migration scripts

This migration strategy ensures minimal risk while providing a smooth transition from Firebase to Supabase with improved performance and reduced costs.