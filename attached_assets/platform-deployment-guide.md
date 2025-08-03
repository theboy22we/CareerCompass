# KLOUD BUGS Platform Deployment Guide

## Overview
This guide outlines the deployment procedures for the KLOUD BUGS MINING COMMAND CENTER platform. Follow these instructions carefully to ensure proper setup and security of each deployment mode.

## Platform Deployment Modes

### 1. Development Mode
- Full access to all platform features and components
- Admin Guardian active with all capabilities
- Debugging tools enabled
- Not suitable for production use

### 2. Admin Mode
- Administrative capabilities enabled
- Admin Guardian active for owner operations
- Suitable for platform management
- Should only be deployed on secure, private servers

### 3. Public Mode
- User-facing interface only
- No Admin Guardian capabilities exposed
- All sensitive operations disabled
- Suitable for public-facing deployment

## Deployment Checklist

### Pre-Deployment Verification
Before deploying any version, run the verification script:
```
./verify-platform.sh
```

This script will check:
- Admin Guardian configuration
- Public deployment security
- Payment configuration
- API security
- Startup functionality in each mode

### Development Deployment Steps
1. Set environment variables:
   ```
   export PLATFORM_MODE="DEVELOPMENT"
   export ADMIN_GUARDIAN_ACTIVE="true"
   ```

2. Start the server:
   ```
   npm run dev
   ```

3. Verify all components are functioning:
   - AI mining core
   - Cloud miner
   - Admin interfaces
   - Mining controller
   - User interfaces

### Admin Deployment Steps
1. Set environment variables:
   ```
   export PLATFORM_MODE="ADMIN"
   export ADMIN_GUARDIAN_ACTIVE="true"
   ```

2. Prepare deployment files:
   ```
   npm run build:admin
   ```

3. Deploy to secure administrative server only
   - Ensure server has proper security measures:
     - Firewall configuration
     - Access control
     - SSL/TLS encryption
     - IP restrictions

4. Verify administrative functions after deployment

### Public Deployment Steps
1. Set environment variables:
   ```
   export PLATFORM_MODE="PUBLIC"
   export ADMIN_GUARDIAN_ACTIVE="false"
   ```

2. Prepare deployment files:
   ```
   npm run build:public
   ```

3. Verify no sensitive code or data is included:
   ```
   ./scripts/check-public-security.sh
   ```

4. Deploy to public-facing server

## Security Considerations

### Admin Guardian Protection
- Never deploy Admin Guardian components to public servers
- Keep all Admin Guardian files in a secure, encrypted location
- Use separate deployment pipelines for Admin and Public modes
- Regularly rotate access credentials

### Payment Address Security
- Payment addresses must only exist in the Admin Guardian configuration
- Never expose payment addresses in public-facing code or interfaces
- Use proxy APIs for payment processing to avoid direct exposure
- Implement transaction verification to ensure payments go to authorized addresses

### Sensitive Data Handling
- Keep all secrets in the Admin Guardian secrets directory
- Use environment variables for runtime configuration
- Never commit sensitive data to repositories
- Use a secure vault service for production secrets management

## Emergency Procedures

### Security Incident Response
1. Immediately shut down affected services:
   ```
   ./scripts/emergency-shutdown.sh
   ```

2. Rotate all credentials and payment addresses
3. Verify integrity of all system components
4. Deploy clean installation after thorough verification

### Backup and Recovery
- Maintain encrypted backups of all Admin Guardian configurations
- Store backups in physically separate locations
- Test recovery procedures regularly
- Document all configuration changes

## Maintenance
- Run verification script before and after any configuration changes
- Test all modes after updates to shared components
- Maintain separate change management processes for Admin and Public components
- Schedule regular security audits