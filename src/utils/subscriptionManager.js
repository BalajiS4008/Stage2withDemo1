import { getUsers } from '../db/dexieDB';
import { getDevicesByUserId, getDeviceByDeviceId, addDevice, updateDeviceLastActive } from '../db/dexieDB';
import { getProjects } from '../db/dexieDB';

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 49,
    annualPrice: 39,
    userLimit: 3,
    deviceLimit: 10, // Unlimited devices per user, but max 10 total
    projectLimit: 10,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB in bytes
    features: {
      whatsappIntegration: false,
      advancedAnalytics: false,
      supplierManagement: false,
      prioritySupport: false,
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 149,
    annualPrice: 119,
    userLimit: 10,
    deviceLimit: 50,
    projectLimit: 50,
    storageLimit: 25 * 1024 * 1024 * 1024, // 25 GB in bytes
    features: {
      whatsappIntegration: true,
      advancedAnalytics: true,
      supplierManagement: true,
      prioritySupport: true,
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 399,
    annualPrice: 319,
    userLimit: -1, // Unlimited
    deviceLimit: -1, // Unlimited
    projectLimit: -1, // Unlimited
    storageLimit: 100 * 1024 * 1024 * 1024, // 100 GB in bytes
    features: {
      whatsappIntegration: true,
      advancedAnalytics: true,
      supplierManagement: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      dedicatedSupport: true,
    }
  }
};

/**
 * Get subscription tier configuration
 */
export const getSubscriptionTier = (tierId) => {
  return SUBSCRIPTION_TIERS[tierId] || SUBSCRIPTION_TIERS.starter;
};

/**
 * Check if user count is within limit
 */
export const checkUserLimit = async (subscriptionTier) => {
  const tier = getSubscriptionTier(subscriptionTier);
  
  // Unlimited users
  if (tier.userLimit === -1) {
    return { allowed: true, current: 0, limit: -1, remaining: -1 };
  }

  const users = await getUsers();
  const currentCount = users.length;

  return {
    allowed: currentCount < tier.userLimit,
    current: currentCount,
    limit: tier.userLimit,
    remaining: tier.userLimit - currentCount,
    isNearLimit: (tier.userLimit - currentCount) <= 1
  };
};

/**
 * Check if device count is within limit
 */
export const checkDeviceLimit = async (subscriptionTier) => {
  const tier = getSubscriptionTier(subscriptionTier);
  
  // Unlimited devices
  if (tier.deviceLimit === -1) {
    return { allowed: true, current: 0, limit: -1, remaining: -1 };
  }

  // Get all users and their devices
  const users = await getUsers();
  let totalDevices = 0;
  
  for (const user of users) {
    const devices = await getDevicesByUserId(user.id);
    totalDevices += devices.length;
  }

  return {
    allowed: totalDevices < tier.deviceLimit,
    current: totalDevices,
    limit: tier.deviceLimit,
    remaining: tier.deviceLimit - totalDevices,
    isNearLimit: (tier.deviceLimit - totalDevices) <= 2
  };
};

/**
 * Check if project count is within limit
 */
export const checkProjectLimit = async (subscriptionTier, userId, isAdmin) => {
  const tier = getSubscriptionTier(subscriptionTier);
  
  // Unlimited projects
  if (tier.projectLimit === -1) {
    return { allowed: true, current: 0, limit: -1, remaining: -1 };
  }

  const projects = await getProjects(userId, isAdmin);
  const activeProjects = projects.filter(p => p.status === 'active');
  const currentCount = activeProjects.length;

  return {
    allowed: currentCount < tier.projectLimit,
    current: currentCount,
    limit: tier.projectLimit,
    remaining: tier.projectLimit - currentCount,
    isNearLimit: (tier.projectLimit - currentCount) <= 2
  };
};

/**
 * Register or update device
 */
export const registerDevice = async (userId, deviceInfo) => {
  const deviceId = generateDeviceId(deviceInfo);
  
  // Check if device already exists
  const existingDevice = await getDeviceByDeviceId(deviceId);
  
  if (existingDevice) {
    // Update last active time
    await updateDeviceLastActive(deviceId);
    return existingDevice;
  }

  // Create new device
  const newDevice = await addDevice({
    userId,
    deviceId,
    deviceName: deviceInfo.deviceName || 'Unknown Device',
    deviceType: deviceInfo.deviceType || 'desktop',
    browser: deviceInfo.browser || 'Unknown',
    os: deviceInfo.os || 'Unknown',
    lastActive: new Date().toISOString()
  });

  return newDevice;
};

/**
 * Generate unique device ID based on device info
 */
export const generateDeviceId = (deviceInfo) => {
  const { browser, os, deviceType } = deviceInfo;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${deviceType}-${browser}-${os}-${timestamp}-${random}`.replace(/\s+/g, '-').toLowerCase();
};

/**
 * Get current device information
 */
export const getCurrentDeviceInfo = () => {
  const userAgent = navigator.userAgent;

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
  else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
  else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) browser = 'IE';

  // Detect OS
  let os = 'Unknown';
  if (userAgent.indexOf('Win') > -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
  else if (userAgent.indexOf('Android') > -1) os = 'Android';
  else if (userAgent.indexOf('iOS') > -1) os = 'iOS';

  // Detect device type
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    deviceType = /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'mobile';
  }

  return {
    browser,
    os,
    deviceType,
    deviceName: `${os} ${deviceType} - ${browser}`,
    userAgent
  };
};

/**
 * Check if feature is available in subscription tier
 */
export const hasFeature = (subscriptionTier, featureName) => {
  const tier = getSubscriptionTier(subscriptionTier);
  return tier.features[featureName] === true;
};

/**
 * Get subscription status summary
 */
export const getSubscriptionStatus = async (subscriptionTier, userId, isAdmin) => {
  const userLimit = await checkUserLimit(subscriptionTier);
  const deviceLimit = await checkDeviceLimit(subscriptionTier);
  const projectLimit = await checkProjectLimit(subscriptionTier, userId, isAdmin);

  return {
    tier: getSubscriptionTier(subscriptionTier),
    users: userLimit,
    devices: deviceLimit,
    projects: projectLimit,
    hasWarnings: userLimit.isNearLimit || deviceLimit.isNearLimit || projectLimit.isNearLimit,
    isOverLimit: !userLimit.allowed || !deviceLimit.allowed || !projectLimit.allowed
  };
};

/**
 * Validate if action is allowed based on subscription
 */
export const validateAction = async (action, subscriptionTier, userId, isAdmin) => {
  switch (action) {
    case 'add_user':
      const userCheck = await checkUserLimit(subscriptionTier);
      return {
        allowed: userCheck.allowed,
        message: userCheck.allowed
          ? 'User can be added'
          : `User limit reached (${userCheck.current}/${userCheck.limit}). Please upgrade your plan.`
      };

    case 'add_device':
      const deviceCheck = await checkDeviceLimit(subscriptionTier);
      return {
        allowed: deviceCheck.allowed,
        message: deviceCheck.allowed
          ? 'Device can be registered'
          : `Device limit reached (${deviceCheck.current}/${deviceCheck.limit}). Please upgrade your plan.`
      };

    case 'add_project':
      const projectCheck = await checkProjectLimit(subscriptionTier, userId, isAdmin);
      return {
        allowed: projectCheck.allowed,
        message: projectCheck.allowed
          ? 'Project can be created'
          : `Active project limit reached (${projectCheck.current}/${projectCheck.limit}). Please upgrade your plan or complete existing projects.`
      };

    default:
      return { allowed: true, message: 'Action allowed' };
  }
};

/**
 * Admin override - bypass subscription limits
 */
export const adminOverride = (isAdmin) => {
  return isAdmin === true;
};

