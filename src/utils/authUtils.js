/**
 * Authentication and Authorization Utilities
 * Provides role-based access control and user filtering functionality
 */

/**
 * Check if current user is admin
 * @param {Object} user - Current user object from AuthContext
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  if (!user) return false;
  // Check user.role === 'admin' or user.isAdmin === true
  return user?.role === 'admin' || user?.isAdmin === true;
};

/**
 * Get all users for admin filter dropdown
 * Extracts unique users who have created records
 * @param {Array} data - All data items with createdBy field
 * @param {Array} users - All users in the system
 * @param {string} ownerField - Field name that contains owner ID (default: 'createdBy')
 * @returns {Array} - Array of unique users who have created records
 */
export const getRecordCreators = (data, users, ownerField = 'createdBy') => {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (!Array.isArray(users) || users.length === 0) return [];

  // Get unique user IDs from data
  const creatorIds = [...new Set(
    data
      .map(item => item[ownerField])
      .filter(Boolean) // Remove null/undefined
  )];

  // Map to user objects
  const creators = creatorIds
    .map(id => users.find(u => u.id === id || u.uid === id))
    .filter(Boolean); // Remove any unmatched users

  // Sort by name for better UX
  return creators.sort((a, b) => {
    const nameA = (a.name || a.email || '').toLowerCase();
    const nameB = (b.name || b.email || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

/**
 * Filter data based on user role and selected user filter
 * @param {Array} data - Array of data items
 * @param {Object} currentUser - Current logged-in user
 * @param {string} selectedUserId - Selected user ID from filter (for admins, default: 'all')
 * @param {string} ownerField - Field name that contains owner ID (default: 'createdBy')
 * @returns {Array} - Filtered data
 */
export const filterByUserRole = (data, currentUser, selectedUserId = 'all', ownerField = 'createdBy') => {
  if (!currentUser) return [];
  if (!Array.isArray(data)) return [];

  // Admin users
  if (isAdmin(currentUser)) {
    // If 'all' is selected, return all data
    if (selectedUserId === 'all') return data;

    // If specific user is selected, filter by that user
    return data.filter(item =>
      item[ownerField] === selectedUserId
    );
  }

  // Non-admin users: return only their own data
  return data.filter(item =>
    item[ownerField] === currentUser.id ||
    item[ownerField] === currentUser.uid
  );
};

/**
 * Get display name for a user
 * @param {Object} user - User object
 * @returns {string} - Formatted display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';

  if (user.name) {
    return user.email ? `${user.name} (${user.email})` : user.name;
  }

  return user.email || user.id || 'Unknown User';
};
