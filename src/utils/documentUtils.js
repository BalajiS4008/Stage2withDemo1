/**
 * Document Management Utilities
 * Functions for document operations, version control, and file handling
 */

// Document categories
export const DOCUMENT_CATEGORIES = {
  CONTRACT: 'CONTRACT',
  PERMIT: 'PERMIT',
  DRAWING: 'DRAWING',
  SPECIFICATION: 'SPECIFICATION',
  INVOICE: 'INVOICE',
  PHOTO: 'PHOTO',
  REPORT: 'REPORT',
  CERTIFICATE: 'CERTIFICATE',
  CORRESPONDENCE: 'CORRESPONDENCE',
  OTHER: 'OTHER'
};

// Document types
export const DOCUMENT_TYPES = {
  ORIGINAL: 'ORIGINAL',
  REVISED: 'REVISED',
  FINAL: 'FINAL',
  DRAFT: 'DRAFT'
};

// Document status
export const DOCUMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  SUPERSEDED: 'SUPERSEDED',
  DELETED: 'DELETED'
};

// Access levels
export const ACCESS_LEVELS = {
  VIEW_ONLY: 'VIEW_ONLY',
  DOWNLOAD: 'DOWNLOAD',
  EDIT: 'EDIT'
};

// Activity types
export const ACTIVITY_TYPES = {
  UPLOADED: 'UPLOADED',
  VIEWED: 'VIEWED',
  DOWNLOADED: 'DOWNLOADED',
  EDITED: 'EDITED',
  SHARED: 'SHARED',
  DELETED: 'DELETED',
  RESTORED: 'RESTORED',
  ARCHIVED: 'ARCHIVED'
};

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],

  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],

  // CAD
  'application/acad': ['.dwg'],
  'application/dxf': ['.dxf'],

  // Compressed
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar']
};

// Max file size (25MB)
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Generate document number
 * Format: DOC-PROJ-XXX
 */
export const generateDocumentNumber = (existingDocuments = [], projectCode = 'PROJ') => {
  const prefix = `DOC-${projectCode}-`;

  const existingNumbers = existingDocuments
    .map(d => d.documentNumber)
    .filter(num => num && num.startsWith(prefix));

  let maxNum = 0;
  existingNumbers.forEach(num => {
    const n = parseInt(num.split('-')[2]);
    if (!isNaN(n) && n > maxNum) {
      maxNum = n;
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}${nextNum}`;
};

/**
 * Generate version number
 * Format: v1.0, v1.1, v2.0
 */
export const generateVersionNumber = (currentVersion = 'v1.0', isMajor = false) => {
  const match = currentVersion.match(/v(\d+)\.(\d+)/);
  if (!match) return 'v1.0';

  let major = parseInt(match[1]);
  let minor = parseInt(match[2]);

  if (isMajor) {
    major += 1;
    minor = 0;
  } else {
    minor += 1;
  }

  return `v${major}.${minor}`;
};

/**
 * Validate file type
 */
export const validateFileType = (fileName, fileType) => {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

  for (const [mimeType, extensions] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (fileType === mimeType || extensions.includes(extension)) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    error: 'File type not allowed. Please upload PDF, DOC, XLS, images, or CAD files.'
  };
};

/**
 * Validate file size
 */
export const validateFileSize = (fileSize) => {
  if (fileSize > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  return { valid: true };
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
  return extension;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (fileName, fileType) => {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

  // PDF
  if (extension === '.pdf') return 'file-text';

  // Word
  if (['.doc', '.docx'].includes(extension)) return 'file-text';

  // Excel
  if (['.xls', '.xlsx'].includes(extension)) return 'table';

  // PowerPoint
  if (['.ppt', '.pptx'].includes(extension)) return 'presentation';

  // Images
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(extension)) return 'image';

  // CAD
  if (['.dwg', '.dxf'].includes(extension)) return 'box';

  // Compressed
  if (['.zip', '.rar'].includes(extension)) return 'archive';

  return 'file';
};

/**
 * Get document status color
 */
export const getDocumentStatusColor = (status) => {
  const colors = {
    [DOCUMENT_STATUS.ACTIVE]: 'success',
    [DOCUMENT_STATUS.ARCHIVED]: 'secondary',
    [DOCUMENT_STATUS.SUPERSEDED]: 'warning',
    [DOCUMENT_STATUS.DELETED]: 'danger'
  };
  return colors[status] || 'secondary';
};

/**
 * Check if document is expired
 */
export const isDocumentExpired = (expiryDate) => {
  if (!expiryDate) return false;

  const expiry = new Date(expiryDate);
  const today = new Date();

  return today > expiry;
};

/**
 * Get days until expiry
 */
export const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;

  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Validate document data
 */
export const validateDocumentData = (document) => {
  const errors = [];

  if (!document.fileName || document.fileName.trim() === '') {
    errors.push('File name is required');
  }
  if (!document.category) {
    errors.push('Document category is required');
  }
  if (!document.fileType) {
    errors.push('File type is required');
  }
  if (!document.fileSize || document.fileSize <= 0) {
    errors.push('File size is required');
  }

  // Validate file type
  const fileTypeValidation = validateFileType(document.fileName, document.fileType);
  if (!fileTypeValidation.valid) {
    errors.push(fileTypeValidation.error);
  }

  // Validate file size
  const fileSizeValidation = validateFileSize(document.fileSize);
  if (!fileSizeValidation.valid) {
    errors.push(fileSizeValidation.error);
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Generate share link
 */
export const generateShareLink = (documentId) => {
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${documentId}-${randomString}`;
};

/**
 * Check if share link is valid
 */
export const isShareLinkValid = (sharing) => {
  if (!sharing.isActive) return false;

  if (sharing.expiryDate) {
    const expiry = new Date(sharing.expiryDate);
    const today = new Date();
    if (today > expiry) return false;
  }

  return true;
};

/**
 * Calculate storage usage
 */
export const calculateStorageUsage = (documents = []) => {
  const totalSize = documents.reduce((sum, doc) => {
    return sum + parseFloat(doc.fileSize || 0);
  }, 0);

  const byCategory = {};
  documents.forEach(doc => {
    const category = doc.category || 'OTHER';
    if (!byCategory[category]) {
      byCategory[category] = { count: 0, size: 0 };
    }
    byCategory[category].count += 1;
    byCategory[category].size += parseFloat(doc.fileSize || 0);
  });

  return {
    totalDocuments: documents.length,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
    byCategory
  };
};

/**
 * Get document by search query
 */
export const searchDocuments = (documents = [], query = '') => {
  if (!query || query.trim() === '') return documents;

  const searchTerm = query.toLowerCase().trim();

  return documents.filter(doc => {
    return (
      (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm)) ||
      (doc.title && doc.title.toLowerCase().includes(searchTerm)) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  });
};

/**
 * Filter documents by category
 */
export const filterByCategory = (documents = [], category) => {
  if (!category) return documents;
  return documents.filter(doc => doc.category === category);
};

/**
 * Filter documents by project
 */
export const filterByProject = (documents = [], projectId) => {
  if (!projectId) return documents;
  return documents.filter(doc => doc.projectId === projectId);
};

/**
 * Filter documents by date range
 */
export const filterByDateRange = (documents = [], startDate, endDate) => {
  if (!startDate && !endDate) return documents;

  return documents.filter(doc => {
    const docDate = new Date(doc.createdAt || doc.issueDate);

    if (startDate && endDate) {
      return docDate >= new Date(startDate) && docDate <= new Date(endDate);
    } else if (startDate) {
      return docDate >= new Date(startDate);
    } else if (endDate) {
      return docDate <= new Date(endDate);
    }

    return true;
  });
};

/**
 * Get expiring documents
 */
export const getExpiringDocuments = (documents = [], daysThreshold = 30) => {
  return documents.filter(doc => {
    if (!doc.expiryDate) return false;

    const daysUntil = getDaysUntilExpiry(doc.expiryDate);
    return daysUntil !== null && daysUntil > 0 && daysUntil <= daysThreshold;
  });
};

/**
 * Get most accessed documents
 */
export const getMostAccessedDocuments = (documents = [], activities = [], limit = 10) => {
  const accessCounts = {};

  activities.forEach(activity => {
    if (activity.activityType === ACTIVITY_TYPES.VIEWED ||
        activity.activityType === ACTIVITY_TYPES.DOWNLOADED) {
      accessCounts[activity.documentId] = (accessCounts[activity.documentId] || 0) + 1;
    }
  });

  return documents
    .map(doc => ({
      ...doc,
      accessCount: accessCounts[doc.id] || 0
    }))
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, limit);
};

/**
 * Create document activity log entry
 */
export const createActivityLog = (documentId, activityType, userId, details = '') => {
  return {
    documentId,
    activityType,
    performedBy: userId,
    performedDate: new Date().toISOString(),
    details,
    ipAddress: '' // Would be populated from request
  };
};

/**
 * Compare document versions
 */
export const compareVersions = (version1, version2) => {
  const v1 = version1.match(/v(\d+)\.(\d+)/);
  const v2 = version2.match(/v(\d+)\.(\d+)/);

  if (!v1 || !v2) return 0;

  const major1 = parseInt(v1[1]);
  const minor1 = parseInt(v1[2]);
  const major2 = parseInt(v2[1]);
  const minor2 = parseInt(v2[2]);

  if (major1 !== major2) return major1 - major2;
  return minor1 - minor2;
};

// Alias for backward compatibility
export const getDocumentIcon = getFileIcon;

export default {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
  ACCESS_LEVELS,
  ACTIVITY_TYPES,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  generateDocumentNumber,
  generateVersionNumber,
  validateFileType,
  validateFileSize,
  getFileExtension,
  formatFileSize,
  getFileIcon,
  getDocumentIcon,
  getDocumentStatusColor,
  isDocumentExpired,
  getDaysUntilExpiry,
  validateDocumentData,
  generateShareLink,
  isShareLinkValid,
  calculateStorageUsage,
  searchDocuments,
  filterByCategory,
  filterByProject,
  filterByDateRange,
  getExpiringDocuments,
  getMostAccessedDocuments,
  createActivityLog,
  compareVersions
};
