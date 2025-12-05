/**
 * Secure file download helpers for CSP compliance
 * Provides centralized, memory-safe file download functionality
 */

/**
 * Securely downloads a file from a data URL
 * @param {string} dataUrl - Base64 data URL
 * @param {string} fileName - Download filename
 */
export function downloadFile(dataUrl, fileName) {
  // Validate data URL format
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL');
  }

  try {
    // Convert data URL to Blob
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });

    // Download the blob
    downloadBlob(blob, fileName);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * Downloads a blob directly
 * @param {Blob} blob - Blob to download
 * @param {string} fileName - Download filename
 */
export function downloadBlob(blob, fileName) {
  // Create temporary object URL (safer than data URLs)
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup (important for memory management)
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Downloads text content as a file
 * @param {string} content - Text content to download
 * @param {string} fileName - Download filename
 * @param {string} mimeType - MIME type (default: text/plain)
 */
export function downloadText(content, fileName, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
}

/**
 * Downloads JSON data as a file
 * @param {Object} data - JSON data to download
 * @param {string} fileName - Download filename
 */
export function downloadJSON(data, fileName) {
  const content = JSON.stringify(data, null, 2);
  downloadText(content, fileName, 'application/json');
}

// Default export containing all functions
export default {
  downloadFile,
  downloadBlob,
  downloadText,
  downloadJSON
};
