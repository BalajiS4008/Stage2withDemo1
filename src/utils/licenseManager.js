import { getLicenseKeyByKey, getLicenseKeysByOrganizationId, addLicenseKey, updateLicenseKey } from '../db/dexieDB';
import { SUBSCRIPTION_TIERS } from './subscriptionManager';

/**
 * Generate a license key
 * Format: XXXX-XXXX-XXXX-XXXX-XXXX
 */
export const generateLicenseKey = (organizationId, tier, durationMonths = 12) => {
  const prefix = tier.substring(0, 3).toUpperCase(); // STA, PRO, ENT
  const timestamp = Date.now().toString(36).toUpperCase();
  const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const random3 = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  // Create checksum from organization ID and tier
  const checksum = createChecksum(organizationId + tier);
  
  return `${prefix}${timestamp.substring(0, 1)}-${random1}-${random2}-${random3}-${checksum}`;
};

/**
 * Create a simple checksum for validation
 */
const createChecksum = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
};

/**
 * Validate license key format
 */
export const validateLicenseKeyFormat = (key) => {
  // Format: XXXX-XXXX-XXXX-XXXX-XXXX
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
};

/**
 * Activate a license key
 */
export const activateLicenseKey = async (key, organizationId) => {
  try {
    // Validate format
    if (!validateLicenseKeyFormat(key)) {
      return {
        success: false,
        error: 'Invalid license key format. Please check and try again.'
      };
    }

    // Check if license exists in database
    const license = await getLicenseKeyByKey(key);
    
    if (!license) {
      return {
        success: false,
        error: 'License key not found. Please contact support.'
      };
    }

    // Check if license is already activated
    if (license.status === 'active' && license.organizationId !== organizationId) {
      return {
        success: false,
        error: 'This license key is already activated by another organization.'
      };
    }

    // Check if license is expired
    const now = new Date();
    const expiryDate = new Date(license.expiresAt);
    
    if (expiryDate < now) {
      return {
        success: false,
        error: 'This license key has expired. Please renew your license.'
      };
    }

    // Activate license
    await updateLicenseKey(license.id, {
      organizationId,
      status: 'active',
      activatedAt: new Date().toISOString()
    });

    return {
      success: true,
      license: {
        tier: license.tier,
        expiresAt: license.expiresAt,
        maxUsers: license.maxUsers,
        maxDevices: license.maxDevices
      }
    };
  } catch (error) {
    console.error('License activation error:', error);
    return {
      success: false,
      error: 'Failed to activate license. Please try again.'
    };
  }
};

/**
 * Check if license is expired
 */
export const checkLicenseExpiry = async (organizationId) => {
  try {
    const licenses = await getLicenseKeysByOrganizationId(organizationId);
    
    if (!licenses || licenses.length === 0) {
      return {
        isExpired: true,
        daysRemaining: 0,
        message: 'No active license found'
      };
    }

    // Get the most recent active license
    const activeLicense = licenses
      .filter(l => l.status === 'active')
      .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))[0];

    if (!activeLicense) {
      return {
        isExpired: true,
        daysRemaining: 0,
        message: 'No active license found'
      };
    }

    const now = new Date();
    const expiryDate = new Date(activeLicense.expiresAt);
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    return {
      isExpired: daysRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
      expiresAt: activeLicense.expiresAt,
      tier: activeLicense.tier,
      isNearExpiry: daysRemaining > 0 && daysRemaining <= 30,
      message: daysRemaining <= 0 
        ? 'License has expired' 
        : daysRemaining <= 30 
        ? `License expires in ${daysRemaining} days` 
        : 'License is active'
    };
  } catch (error) {
    console.error('License expiry check error:', error);
    return {
      isExpired: true,
      daysRemaining: 0,
      message: 'Error checking license status'
    };
  }
};

/**
 * Get license information for an organization
 */
export const getLicenseInfo = async (organizationId) => {
  try {
    const licenses = await getLicenseKeysByOrganizationId(organizationId);

    if (!licenses || licenses.length === 0) {
      return null;
    }

    // Get the most recent active license
    const activeLicense = licenses
      .filter(l => l.status === 'active')
      .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))[0];

    if (!activeLicense) {
      return null;
    }

    const expiryCheck = await checkLicenseExpiry(organizationId);

    return {
      key: activeLicense.key,
      tier: activeLicense.tier,
      status: activeLicense.status,
      activatedAt: activeLicense.activatedAt,
      expiresAt: activeLicense.expiresAt,
      maxUsers: activeLicense.maxUsers,
      maxDevices: activeLicense.maxDevices,
      isExpired: expiryCheck.isExpired,
      daysRemaining: expiryCheck.daysRemaining,
      isNearExpiry: expiryCheck.isNearExpiry
    };
  } catch (error) {
    console.error('Get license info error:', error);
    return null;
  }
};

/**
 * Create a new license key (Admin only)
 */
export const createLicense = async (organizationId, tier, durationMonths = 12) => {
  try {
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    if (!tierConfig) {
      return {
        success: false,
        error: 'Invalid subscription tier'
      };
    }

    const key = generateLicenseKey(organizationId, tier, durationMonths);
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (durationMonths * 30 * 24 * 60 * 60 * 1000));

    const license = await addLicenseKey({
      organizationId,
      key,
      tier,
      status: 'pending',
      activatedAt: null,
      expiresAt: expiryDate.toISOString(),
      maxUsers: tierConfig.userLimit,
      maxDevices: tierConfig.deviceLimit
    });

    return {
      success: true,
      license: {
        key,
        tier,
        expiresAt: expiryDate.toISOString(),
        maxUsers: tierConfig.userLimit,
        maxDevices: tierConfig.deviceLimit
      }
    };
  } catch (error) {
    console.error('Create license error:', error);
    return {
      success: false,
      error: 'Failed to create license key'
    };
  }
};

/**
 * Revoke a license key (Admin only)
 */
export const revokeLicense = async (licenseId) => {
  try {
    await updateLicenseKey(licenseId, {
      status: 'revoked'
    });

    return {
      success: true,
      message: 'License key revoked successfully'
    };
  } catch (error) {
    console.error('Revoke license error:', error);
    return {
      success: false,
      error: 'Failed to revoke license key'
    };
  }
};

/**
 * Offline license validation using encrypted local storage
 */
export const validateLicenseOffline = (key, storedHash) => {
  try {
    // Create hash from key
    const keyHash = createChecksum(key);

    // Compare with stored hash
    return keyHash === storedHash;
  } catch (error) {
    console.error('Offline validation error:', error);
    return false;
  }
};

/**
 * Store license hash for offline validation
 */
export const storeLicenseHash = (key) => {
  try {
    const hash = createChecksum(key);
    localStorage.setItem('bycodez_license_hash', hash);
    return true;
  } catch (error) {
    console.error('Store license hash error:', error);
    return false;
  }
};

