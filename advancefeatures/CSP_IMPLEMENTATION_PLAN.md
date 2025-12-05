# Content Security Policy (CSP) Implementation Plan

## Executive Summary

This document outlines the implementation plan for establishing a robust Content Security Policy (CSP) for the Construction Billing Software application. While the codebase demonstrates good security practices with **no eval() usage or dangerous string-based code execution**, there are structural improvements needed to enable strict CSP enforcement without breaking functionality.

**Current Status**: No CSP policy implemented
**Security Assessment**: 7/10 (Clean code, but no CSP enforcement)
**Estimated Implementation Time**: 2-3 weeks
**Priority**: HIGH (Security & Compliance)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current State Analysis](#current-state-analysis)
3. [CSP Violations Identified](#csp-violations-identified)
4. [Implementation Strategy](#implementation-strategy)
5. [Phase 1: Font Loading Refactor](#phase-1-font-loading-refactor)
6. [Phase 2: Data URL Management](#phase-2-data-url-management)
7. [Phase 3: CSP Policy Configuration](#phase-3-csp-policy-configuration)
8. [Phase 4: File Download Security](#phase-4-file-download-security)
9. [Phase 5: Testing & Validation](#phase-5-testing-validation)
10. [Risk Assessment](#risk-assessment)
11. [Rollback Plan](#rollback-plan)
12. [Success Metrics](#success-metrics)

---

## Problem Statement

### Issue Description

The browser DevTools Console is reporting:
```
The Content Security Policy (CSP) prevents the evaluation of arbitrary strings as JavaScript
to make it more difficult for an attacker to inject unauthorized code on your site.

Source location: script-src
Directive: blocked
Status: violated

More information: https://web.dev/articles/csp?utm_source=devtools&utm_campaign=stable#eval_too
```

### Root Cause

1. **No CSP Headers or Meta Tags**: Application currently has no Content Security Policy defined
2. **Inline Font Loading in Components**: Google Fonts loaded dynamically within React components
3. **Data URL Usage**: SVG and file data embedded using data: protocol without CSP allowlist
4. **Dynamic DOM Manipulation**: File downloads use `document.createElement()` and `appendChild()`

### Impact

- **Security Risk**: Without CSP, the application is vulnerable to XSS attacks and code injection
- **Compliance**: Modern security standards require CSP implementation
- **Browser Warnings**: Console warnings reduce user trust
- **Production Readiness**: Blocks deployment to security-conscious environments

---

## Current State Analysis

### Good Security Practices Found ✅

Our codebase analysis confirms:

- ✅ **No `eval()` statements** anywhere in the codebase
- ✅ **No `new Function()` constructor usage**
- ✅ **No string-based `setTimeout/setInterval`** (all use arrow functions)
- ✅ **No `innerHTML` or `dangerouslySetInnerHTML`**
- ✅ **No `document.write()` calls**
- ✅ **No `javascript:` protocol URLs**
- ✅ **No inline event handlers** with string code
- ✅ **Clean ESM imports** for all third-party libraries

### Libraries Using Safe Patterns ✅

All dependencies use safe, CSP-compliant patterns:
- **jsPDF**: PDF generation (no eval)
- **Recharts**: Data visualization (React components)
- **XLSX**: Excel export (proper imports)
- **Firebase**: Authentication & Firestore sync
- **Dexie.js**: IndexedDB wrapper

---

## CSP Violations Identified

### Critical Issues (Must Fix Before CSP Enforcement)

#### 1. Inline Font Loading in React Components

**Files Affected**:
```
src/components/InvoicePreviewModal.jsx:972
src/components/QuotationPreviewModal.jsx:464
src/components/SignatureSettings.jsx:295
```

**Current Code**:
```jsx
<link
  href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&family=Playfair+Display:ital,wght@0,400;1,700&family=Montserrat:wght@400;600&display=swap"
  rel="stylesheet"
/>
```

**Issue**: Inline `<link>` tags in JSX violate `style-src` CSP directive

**CSP Directive Violated**: `style-src`

---

#### 2. Data URLs in Inline Styles

**Files Affected**:
```
src/pages/UserManagement.jsx:633
src/pages/Parties.jsx:658
```

**Current Code** (UserManagement.jsx):
```jsx
style={{
  backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg...')",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  backgroundSize: '20px'
}}
```

**Current Code** (Parties.jsx):
```jsx
<img
  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'..."
  alt="No data"
/>
```

**Issue**: Data URLs without CSP allowlist

**CSP Directive Violated**: `img-src`, `style-src`

---

#### 3. Dynamic Iframe with Data URLs

**Files Affected**:
```
src/components/AttachmentBadge.jsx:156-159
src/components/FileUpload.jsx:156-159
```

**Current Code**:
```jsx
<iframe
  src={previewFile.data}  // Contains base64 data URL
  className="w-full h-[70vh] border-0"
  title={previewFile.name}
/>
```

**Issue**: User-uploaded PDF previews use data URLs in iframe src

**CSP Directive Violated**: `frame-src`

---

#### 4. DOM Manipulation for File Downloads

**Files Affected**:
```
src/components/AttachmentBadge.jsx:14-19
src/components/FileUpload.jsx:61-66
src/utils/dataManager.jsx:454-456, 493-495, 540-542
src/utils/exportUtils.js:228-230, 904-906
```

**Current Code Pattern**:
```jsx
const link = document.createElement('a');
link.href = attachment.data;  // Data URL
link.download = attachment.name;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```

**Issue**: Direct DOM manipulation with data URLs; bypass React's safety

**Risk Level**: MEDIUM (used for downloads, but needs validation)

---

## Implementation Strategy

### Philosophy

**Goal**: Implement the strictest possible CSP without breaking functionality

**Approach**: Progressive enhancement in 5 phases
1. Fix structural issues first (fonts, data URLs)
2. Implement CSP in report-only mode
3. Monitor violations
4. Enforce CSP strictly
5. Continuous monitoring

**Timeline**: 2-3 weeks

---

## Phase 1: Font Loading Refactor

**Duration**: 2-3 days
**Priority**: P0 (Blocker for CSP)

### Tasks

#### Task 1.1: Move Font Loading to index.html

**Current State**: Google Fonts loaded in 3 React components

**Target State**: All fonts loaded in root `index.html`

**Implementation**:

1. **Update index.html** (already has Inter font):
   ```html
   <!-- Existing -->
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

   <!-- ADD: Signature fonts for PDF/previews -->
   <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&family=Playfair+Display:ital,wght@0,400;1,700&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
   ```

2. **Remove inline link tags** from:
   - `src/components/InvoicePreviewModal.jsx:972`
   - `src/components/QuotationPreviewModal.jsx:464`
   - `src/components/SignatureSettings.jsx:295`

**Testing**:
- Verify signature fonts render correctly in all 3 components
- Check PDF generation with signature fonts
- Test invoice and quotation previews

**Files to Modify**:
```
index.html
src/components/InvoicePreviewModal.jsx
src/components/QuotationPreviewModal.jsx
src/components/SignatureSettings.jsx
```

**Risk**: LOW - Fonts will load globally instead of component-level

---

## Phase 2: Data URL Management

**Duration**: 3-4 days
**Priority**: P0 (Blocker for CSP)

### Tasks

#### Task 2.1: Refactor SVG Data URLs to CSS Classes

**Current Issue**: Inline SVG data URLs in `UserManagement.jsx` and `Parties.jsx`

**Solution**: Move SVG backgrounds to CSS file

**Implementation**:

1. **Create CSS utility classes** in `src/index.css`:
   ```css
   /* User status indicator SVG background */
   .user-status-indicator {
     background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='%23cbd5e0' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e");
     background-repeat: no-repeat;
     background-position: right 1rem center;
     background-size: 20px;
   }

   /* Empty state illustration */
   .empty-state-illustration {
     /* SVG data URL from Parties.jsx */
   }
   ```

2. **Update UserManagement.jsx:633**:
   ```jsx
   // BEFORE:
   <select
     style={{
       backgroundImage: "url('data:image/svg+xml;...')",
       backgroundRepeat: 'no-repeat',
       backgroundPosition: 'right 1rem center',
       backgroundSize: '20px'
     }}
   >

   // AFTER:
   <select className="user-status-indicator">
   ```

3. **Update Parties.jsx:658**:
   ```jsx
   // BEFORE:
   <img src="data:image/svg+xml,%3Csvg..." alt="No data" />

   // AFTER:
   <div className="empty-state-illustration" role="img" aria-label="No data"></div>
   ```

**Files to Modify**:
```
src/index.css
src/pages/UserManagement.jsx
src/pages/Parties.jsx
```

**Risk**: LOW - Pure CSS refactor, no logic change

---

#### Task 2.2: Implement Secure PDF Preview Strategy

**Current Issue**: iframes use data URLs for PDF preview

**Options**:

**Option A: Use PDF.js Library** (Recommended)
- Better control over rendering
- No iframe data URL needed
- More features (zoom, pagination)

**Option B: Keep iframe with sandboxing**
- Add `sandbox` attribute with restrictions
- Require `frame-src data:` in CSP
- Less secure than Option A

**Recommended**: **Option A - PDF.js**

**Implementation (Option A)**:

1. **Install PDF.js**:
   ```bash
   npm install pdfjs-dist
   ```

2. **Create PdfViewer component**:
   ```jsx
   // src/components/PdfViewer.jsx
   import { useState, useEffect, useRef } from 'react';
   import * as pdfjsLib from 'pdfjs-dist';

   pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

   export default function PdfViewer({ dataUrl, fileName }) {
     const canvasRef = useRef(null);
     const [numPages, setNumPages] = useState(0);
     const [pageNum, setPageNum] = useState(1);

     useEffect(() => {
       const loadPdf = async () => {
         const loadingTask = pdfjsLib.getDocument(dataUrl);
         const pdf = await loadingTask.promise;
         setNumPages(pdf.numPages);

         const page = await pdf.getPage(pageNum);
         const viewport = page.getViewport({ scale: 1.5 });

         const canvas = canvasRef.current;
         const context = canvas.getContext('2d');
         canvas.height = viewport.height;
         canvas.width = viewport.width;

         await page.render({ canvasContext: context, viewport }).promise;
       };

       loadPdf();
     }, [dataUrl, pageNum]);

     return (
       <div className="pdf-viewer">
         <canvas ref={canvasRef} />
         <div className="pdf-controls">
           <button onClick={() => setPageNum(p => Math.max(1, p - 1))}>Previous</button>
           <span>Page {pageNum} of {numPages}</span>
           <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))}>Next</button>
         </div>
       </div>
     );
   }
   ```

3. **Replace iframe in AttachmentBadge.jsx**:
   ```jsx
   // BEFORE:
   <iframe
     src={previewFile.data}
     className="w-full h-[70vh] border-0"
     title={previewFile.name}
   />

   // AFTER:
   {previewFile.type === 'application/pdf' ? (
     <PdfViewer dataUrl={previewFile.data} fileName={previewFile.name} />
   ) : (
     <iframe src={previewFile.data} className="w-full h-[70vh] border-0" title={previewFile.name} />
   )}
   ```

4. **Update CSP to allow PDF.js worker**:
   ```
   script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/pdf.js/;
   worker-src 'self' blob:;
   ```

**Files to Modify**:
```
package.json
src/components/PdfViewer.jsx (new file)
src/components/AttachmentBadge.jsx
src/components/FileUpload.jsx
```

**Risk**: MEDIUM - New dependency, rendering changes

---

## Phase 3: CSP Policy Configuration

**Duration**: 2-3 days
**Priority**: P0

### Tasks

#### Task 3.1: Implement CSP Meta Tag (Development)

**Goal**: Add CSP in report-only mode first

**Implementation**:

1. **Add CSP meta tag to index.html**:
   ```html
   <head>
     <!-- Existing meta tags -->

     <!-- Content Security Policy (Report-Only Mode) -->
     <meta http-equiv="Content-Security-Policy-Report-Only" content="
       default-src 'self';
       script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/pdf.js/;
       style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
       font-src 'self' https://fonts.gstatic.com;
       img-src 'self' data: https:;
       connect-src 'self'
         https://*.firebaseapp.com
         https://*.googleapis.com
         https://*.firebaseio.com;
       frame-src 'self' data:;
       worker-src 'self' blob:;
       object-src 'none';
       base-uri 'self';
       form-action 'self';
       frame-ancestors 'none';
       upgrade-insecure-requests;
     ">
   </head>
   ```

**Note**: Using `Content-Security-Policy-Report-Only` first to monitor without blocking

**Files to Modify**:
```
index.html
```

**Risk**: NONE (report-only mode)

---

#### Task 3.2: Remove 'unsafe-inline' from style-src

**Goal**: Eliminate need for 'unsafe-inline' in styles

**Current Issue**: Bootstrap and Tailwind may use inline styles

**Investigation Required**:
1. Audit all inline `style={{}}` attributes in components
2. Identify which are necessary vs. can be moved to CSS
3. Consider using nonce-based CSP for critical inline styles

**Implementation Strategy**:

**Option A: Move to CSS Modules**
- Convert inline styles to CSS modules
- More work, but cleanest solution

**Option B: Use Nonce-Based CSP**
- Generate nonce at build time
- Add to critical inline styles
- Requires Vite plugin

**Option C: Accept 'unsafe-inline' for style-src**
- Acceptable risk (styles don't execute code)
- Still block script-src strictly

**Recommended**: **Option C** for MVP, **Option A** for future enhancement

**Decision Point**: Discuss with team

---

#### Task 3.3: Configure CSP for Production (Vite Plugin)

**Goal**: Add CSP headers via Vite build process

**Implementation**:

1. **Install Vite plugin**:
   ```bash
   npm install --save-dev vite-plugin-html
   ```

2. **Update vite.config.js**:
   ```javascript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import { createHtmlPlugin } from 'vite-plugin-html';

   export default defineConfig({
     plugins: [
       react(),
       createHtmlPlugin({
         inject: {
           tags: [
             {
               tag: 'meta',
               attrs: {
                 'http-equiv': 'Content-Security-Policy',
                 content: `
                   default-src 'self';
                   script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/pdf.js/;
                   style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                   font-src 'self' https://fonts.gstatic.com;
                   img-src 'self' data: https:;
                   connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.firebaseio.com;
                   frame-src 'self';
                   worker-src 'self' blob:;
                   object-src 'none';
                   base-uri 'self';
                   form-action 'self';
                   frame-ancestors 'none';
                   upgrade-insecure-requests;
                 `.replace(/\s+/g, ' ').trim()
               }
             }
           ]
         }
       })
     ],
     // ... rest of config
   });
   ```

**Files to Modify**:
```
package.json
vite.config.js
```

**Risk**: LOW - Only affects production build

---

#### Task 3.4: Environment-Based CSP Configuration

**Goal**: Different CSP for development vs. production

**Implementation**:

1. **Create CSP config file**:
   ```javascript
   // src/config/csp.js
   export const CSP_POLICIES = {
     development: {
       'default-src': ["'self'"],
       'script-src': ["'self'", "'unsafe-eval'"], // Allow eval in dev for HMR
       'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
       'font-src': ["'self'", "https://fonts.gstatic.com"],
       'img-src': ["'self'", "data:", "https:"],
       'connect-src': ["'self'", "ws://localhost:*", "https://*.firebaseapp.com", "https://*.googleapis.com"],
       'frame-src': ["'self'", "data:"],
       'worker-src': ["'self'", "blob:"],
       'object-src': ["'none'"],
       'base-uri': ["'self'"],
       'form-action': ["'self'"],
     },
     production: {
       'default-src': ["'self'"],
       'script-src': ["'self'", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/"],
       'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
       'font-src': ["'self'", "https://fonts.gstatic.com"],
       'img-src': ["'self'", "data:", "https:"],
       'connect-src': ["'self'", "https://*.firebaseapp.com", "https://*.googleapis.com", "https://*.firebaseio.com"],
       'frame-src': ["'self'"],
       'worker-src': ["'self'", "blob:"],
       'object-src': ["'none'"],
       'base-uri': ["'self'"],
       'form-action': ["'self'"],
       'frame-ancestors': ["'none'"],
       'upgrade-insecure-requests': []
     }
   };

   export function generateCSPString(env = 'production') {
     const policy = CSP_POLICIES[env];
     return Object.entries(policy)
       .map(([directive, sources]) =>
         sources.length > 0
           ? `${directive} ${sources.join(' ')}`
           : directive
       )
       .join('; ');
   }
   ```

2. **Update Vite config to use env-based CSP**:
   ```javascript
   import { generateCSPString } from './src/config/csp.js';

   export default defineConfig(({ mode }) => ({
     plugins: [
       // ...
       createHtmlPlugin({
         inject: {
           tags: [
             {
               tag: 'meta',
               attrs: {
                 'http-equiv': mode === 'development'
                   ? 'Content-Security-Policy-Report-Only'
                   : 'Content-Security-Policy',
                 content: generateCSPString(mode)
               }
             }
           ]
         }
       })
     ]
   }));
   ```

**Files to Create/Modify**:
```
src/config/csp.js (new file)
vite.config.js
```

**Risk**: LOW

---

## Phase 4: File Download Security

**Duration**: 2-3 days
**Priority**: P1 (Nice to have, not blocker)

### Tasks

#### Task 4.1: Refactor File Download Mechanism

**Goal**: Replace `document.createElement('a')` pattern with Blob API

**Current Pattern** (9 locations):
```javascript
const link = document.createElement('a');
link.href = attachment.data;
link.download = attachment.name;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```

**New Pattern**:
```javascript
// src/utils/downloadHelper.js
export function downloadFile(dataUrl, fileName) {
  // Validate data URL
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL');
  }

  // Convert data URL to Blob
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
```

**Files to Update**:
```
src/utils/downloadHelper.js (new file)
src/components/AttachmentBadge.jsx
src/components/FileUpload.jsx
src/utils/dataManager.jsx
src/utils/exportUtils.js
```

**Benefits**:
- Proper cleanup with `revokeObjectURL()`
- Better memory management
- Centralized validation
- TypeScript-ready

**Risk**: LOW - Internal refactor, same functionality

---

#### Task 4.2: Implement Content Validation for User Uploads

**Goal**: Validate uploaded files before processing

**Implementation**:

```javascript
// src/utils/fileValidator.js
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check MIME type
  const allAllowedTypes = Object.values(ALLOWED_MIME_TYPES).flat();
  if (!allAllowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

export function validateDataUrl(dataUrl) {
  // Check if it's a valid data URL
  const dataUrlPattern = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/;
  const match = dataUrl.match(dataUrlPattern);

  if (!match) {
    return { valid: false, error: 'Invalid data URL format' };
  }

  const [, mimeType, base64Data] = match;

  // Validate MIME type
  const allAllowedTypes = Object.values(ALLOWED_MIME_TYPES).flat();
  if (!allAllowedTypes.includes(mimeType)) {
    return { valid: false, error: 'MIME type not allowed' };
  }

  // Validate base64 (basic check)
  try {
    atob(base64Data.substring(0, 100)); // Test decode
  } catch (e) {
    return { valid: false, error: 'Invalid base64 encoding' };
  }

  return { valid: true, mimeType };
}
```

**Update FileUpload.jsx**:
```jsx
import { validateFile } from '../utils/fileValidator';

const handleFileSelect = (e) => {
  const selectedFiles = Array.from(e.target.files);

  // Validate each file
  const validationResults = selectedFiles.map(validateFile);
  const invalidFiles = validationResults.filter(r => !r.valid);

  if (invalidFiles.length > 0) {
    alert(`Invalid files: ${invalidFiles.map(f => f.error).join(', ')}`);
    return;
  }

  // Process valid files...
};
```

**Files to Create/Modify**:
```
src/utils/fileValidator.js (new file)
src/components/FileUpload.jsx
src/components/AttachmentBadge.jsx
```

**Risk**: LOW - Additional validation layer

---

## Phase 5: Testing & Validation

**Duration**: 3-5 days
**Priority**: P0

### Tasks

#### Task 5.1: CSP Report-Only Monitoring

**Goal**: Monitor CSP violations before enforcement

**Implementation**:

1. **Set up report-only mode** (already in Task 3.1)

2. **Monitor browser console** for violations during testing:
   ```javascript
   // Add to src/utils/diagnostics.js
   if (import.meta.env.DEV) {
     window.addEventListener('securitypolicyviolation', (e) => {
       console.error('🚨 CSP Violation:', {
         directive: e.violatedDirective,
         blockedURI: e.blockedURI,
         originalPolicy: e.originalPolicy,
         sourceFile: e.sourceFile,
         lineNumber: e.lineNumber,
       });
     });
   }
   ```

3. **Create CSP violation log**:
   ```javascript
   // src/utils/cspMonitor.js
   const violations = [];

   export function initCSPMonitoring() {
     document.addEventListener('securitypolicyviolation', (e) => {
       const violation = {
         timestamp: new Date().toISOString(),
         directive: e.violatedDirective,
         blockedURI: e.blockedURI,
         sourceFile: e.sourceFile,
         lineNumber: e.lineNumber,
       };

       violations.push(violation);
       console.warn('CSP Violation:', violation);
     });
   }

   export function getViolations() {
     return violations;
   }

   export function clearViolations() {
     violations.length = 0;
   }
   ```

4. **Add to App.jsx**:
   ```jsx
   import { initCSPMonitoring } from './utils/cspMonitor';

   useEffect(() => {
     if (import.meta.env.DEV) {
       initCSPMonitoring();
     }
   }, []);
   ```

**Testing Period**: 1 week in report-only mode

**Files to Modify**:
```
src/utils/diagnostics.js
src/utils/cspMonitor.js (new file)
src/App.jsx
```

**Risk**: NONE (monitoring only)

---

#### Task 5.2: Comprehensive Feature Testing

**Goal**: Test all features with CSP enforced

**Test Matrix**:

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| **Font Loading** | Open Invoice Preview | Signature fonts load correctly |
| | Open Quotation Preview | Custom fonts render |
| | PDF Generation | Fonts embedded in PDF |
| **File Upload** | Upload image | Preview displays correctly |
| | Upload PDF | PDF viewer works (if implemented) |
| | Download attachment | File downloads successfully |
| **Data Export** | Export to Excel | XLSX download works |
| | Export to CSV | CSV download works |
| | Backup data | Encrypted backup downloads |
| **Charts** | Dashboard charts | Recharts render correctly |
| | Budget analytics | EVM charts display |
| **Firebase Sync** | Login | Authentication works |
| | Sync data | Firestore sync successful |
| | Offline mode | Dexie operations work |
| **PDF Generation** | Generate invoice PDF | jsPDF creates PDF |
| | Generate quotation PDF | Custom templates work |

**Test Environments**:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (if available)

**Test Modes**:
1. Report-only mode (monitor violations)
2. Enforced mode (ensure nothing breaks)

---

#### Task 5.3: Performance Testing

**Goal**: Ensure CSP doesn't impact performance

**Metrics to Measure**:
- Page load time (before/after CSP)
- Font loading time
- PDF generation time
- File upload/download time
- Chart rendering time

**Tools**:
- Chrome DevTools Performance tab
- Lighthouse audit

**Acceptance Criteria**:
- No more than 5% performance degradation
- No blocking resources
- Lighthouse security score improvement

---

#### Task 5.4: Create CSP Testing Checklist

**Implementation**:

```markdown
# CSP Implementation Testing Checklist

## Pre-Enforcement (Report-Only Mode)
- [ ] No console errors related to CSP
- [ ] All fonts load correctly
- [ ] All images display
- [ ] File uploads work
- [ ] File downloads work
- [ ] PDF generation works
- [ ] Charts render
- [ ] Firebase sync works
- [ ] No CSP violations logged in monitoring

## Post-Enforcement (Strict Mode)
- [ ] Application loads without errors
- [ ] All features from pre-enforcement still work
- [ ] No inline script violations
- [ ] No eval() violations
- [ ] No unsafe-inline script violations
- [ ] External resources load (fonts, CDN)

## Cross-Browser Testing
- [ ] Chrome - all features work
- [ ] Firefox - all features work
- [ ] Edge - all features work
- [ ] Safari - all features work (if available)

## Performance Testing
- [ ] Page load time acceptable
- [ ] Font loading not blocking
- [ ] PDF generation speed acceptable
- [ ] File operations fast
- [ ] Lighthouse score improved

## Security Validation
- [ ] Lighthouse security audit passes
- [ ] No unsafe-eval in production CSP
- [ ] No unsafe-inline in script-src
- [ ] frame-ancestors set to 'none'
- [ ] upgrade-insecure-requests enabled

## Documentation
- [ ] CSP policy documented
- [ ] Known limitations documented
- [ ] Rollback procedure tested
```

**File to Create**:
```
advancefeatures/CSP_TESTING_CHECKLIST.md
```

---

## Risk Assessment

### High Risk Items

#### 1. Breaking Production Deployment
- **Risk**: CSP enforcement blocks critical functionality
- **Mitigation**:
  - Use report-only mode first
  - Comprehensive testing
  - Staged rollout (dev → staging → production)
  - Rollback plan ready

#### 2. Third-Party Library Incompatibility
- **Risk**: jsPDF, XLSX, or other libraries break under CSP
- **Mitigation**:
  - Audit all third-party libraries
  - Test in isolated environment
  - Check library documentation for CSP compatibility
  - Have alternative libraries ready

#### 3. Firebase Authentication/Sync Breakage
- **Risk**: CSP blocks Firebase connections
- **Mitigation**:
  - Include all Firebase domains in connect-src
  - Test auth flow thoroughly
  - Test Firestore sync
  - Monitor Firebase console for errors

### Medium Risk Items

#### 4. Font Loading Delays
- **Risk**: Moving fonts to index.html causes FOUC (Flash of Unstyled Content)
- **Mitigation**:
  - Use font-display: swap
  - Preconnect to Google Fonts
  - Consider self-hosting fonts (future)

#### 5. PDF Preview User Experience
- **Risk**: Removing iframe data URLs degrades UX
- **Mitigation**:
  - Implement PDF.js with good UI
  - Fallback to download if preview fails
  - Loading indicators

### Low Risk Items

#### 6. Data URL Refactoring
- **Risk**: SVG CSS classes don't render identically
- **Mitigation**:
  - Visual regression testing
  - Side-by-side comparison
  - Easy rollback

#### 7. File Download Refactoring
- **Risk**: Blob API download mechanism fails in some browsers
- **Mitigation**:
  - Test across browsers
  - Fallback to old method if Blob API unavailable

---

## Rollback Plan

### If CSP Breaks Critical Functionality

#### Immediate Rollback (< 5 minutes)

1. **Option A: Switch to Report-Only Mode**
   ```html
   <!-- Change enforcement to report-only -->
   <meta http-equiv="Content-Security-Policy-Report-Only" content="...">
   ```

2. **Option B: Remove CSP Meta Tag**
   ```html
   <!-- Comment out CSP -->
   <!-- <meta http-equiv="Content-Security-Policy" content="..."> -->
   ```

3. **Deploy hotfix**:
   ```bash
   npm run build
   # Deploy dist/ to production
   ```

#### Partial Rollback (Specific Features)

**If Fonts Fail**:
- Revert commits for InvoicePreviewModal, QuotationPreviewModal, SignatureSettings
- Keep inline `<link>` tags temporarily
- Add `style-src 'unsafe-inline'` to CSP

**If PDF Preview Fails**:
- Revert to iframe with data URLs
- Add `frame-src data:` to CSP
- Postpone PDF.js implementation

**If File Downloads Fail**:
- Revert to `document.createElement('a')` pattern
- Keep current download mechanism

#### Full Rollback (Emergency)

```bash
# Checkout last known good commit
git revert <csp-implementation-commit>
npm run build
# Deploy
```

**Recovery Time Objective (RTO)**: < 15 minutes
**Recovery Point Objective (RPO)**: Last commit before CSP implementation

---

## Success Metrics

### Security Metrics

- ✅ **Lighthouse Security Score**: Increase from current to 90+
- ✅ **CSP Coverage**: 100% of application under CSP policy
- ✅ **Violations in Production**: 0 CSP violations in 1 week
- ✅ **Unsafe Directives**: No `unsafe-eval` in production script-src

### Performance Metrics

- ✅ **Page Load Time**: < 5% increase from baseline
- ✅ **Font Loading**: < 2s to font display
- ✅ **PDF Generation**: No change from baseline
- ✅ **Chart Rendering**: No change from baseline

### Functionality Metrics

- ✅ **Test Pass Rate**: 100% of test cases pass
- ✅ **Cross-Browser**: Works in Chrome, Firefox, Edge, Safari
- ✅ **Feature Parity**: All existing features work identically
- ✅ **User Reports**: 0 user-reported CSP-related bugs in 2 weeks

### Code Quality Metrics

- ✅ **Inline Styles**: Reduce by 50%+ (move to CSS)
- ✅ **Data URLs**: Centralized management
- ✅ **Code Duplication**: File download logic deduplicated
- ✅ **Documentation**: CSP policy fully documented

---

## Post-Implementation Monitoring

### Week 1: Intensive Monitoring

**Daily Tasks**:
- Review CSP violation reports
- Monitor browser console logs
- Check Firebase sync logs
- Review user feedback

**Metrics Dashboard**:
```javascript
// src/utils/cspDashboard.js
export function getCSPMetrics() {
  return {
    violationsToday: violations.filter(v => isToday(v.timestamp)).length,
    violationsByDirective: groupBy(violations, 'directive'),
    topViolatedURIs: topN(violations, 'blockedURI', 10),
    violationsTrend: getViolationsTrend(7), // Last 7 days
  };
}
```

### Week 2-4: Standard Monitoring

**Weekly Tasks**:
- Review aggregated CSP metrics
- Performance benchmarking
- Security audit
- Update documentation

### Ongoing: Continuous Improvement

**Monthly Tasks**:
- Review CSP policy for tightening
- Audit new dependencies for CSP compatibility
- Update CSP for new features
- Security best practices review

---

## Documentation Deliverables

### 1. CSP_POLICY.md
Document the final CSP policy with explanations:
```markdown
# Content Security Policy

## Current Policy

default-src 'self';
script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/pdf.js/;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
...

## Directive Explanations

**default-src 'self'**: Only load resources from same origin by default
**script-src**: Allow scripts from self and PDF.js CDN
**style-src 'unsafe-inline'**: Required for Bootstrap/Tailwind (acceptable risk)
...

## Why 'unsafe-inline' for Styles?

Bootstrap and Tailwind use dynamic inline styles extensively...
```

### 2. CSP_TROUBLESHOOTING.md
Common issues and solutions:
```markdown
# CSP Troubleshooting Guide

## Issue: Fonts Not Loading

**Symptoms**: System fonts displayed instead of Google Fonts

**Solution**: Check font-src includes https://fonts.gstatic.com
...
```

### 3. CSP_DEVELOPER_GUIDE.md
Guidelines for developers:
```markdown
# CSP Developer Guidelines

## Adding New External Resources

When adding new CDN resources:
1. Check CSP compatibility
2. Update CSP policy
3. Test in report-only mode
...
```

### 4. Update CLAUDE.md
Add CSP section:
```markdown
## Content Security Policy

This application uses a strict CSP. When adding new features:
- Avoid inline scripts
- Avoid eval() and new Function()
- Use CSS classes instead of inline styles where possible
- Test new dependencies for CSP compatibility
...
```

---

## Timeline & Milestones

### Week 1: Foundation (Phase 1 & 2)
- **Days 1-2**: Font loading refactor
- **Days 3-5**: Data URL management
- **Milestone**: All structural changes complete, no CSP yet

### Week 2: CSP Implementation (Phase 3)
- **Days 1-2**: CSP policy configuration (report-only)
- **Days 3-4**: Monitor violations, refine policy
- **Day 5**: Environment-based configuration
- **Milestone**: CSP in report-only mode, violations monitored

### Week 3: Refinement (Phase 4 & 5)
- **Days 1-3**: File download security refactor
- **Days 4-5**: Comprehensive testing
- **Milestone**: All features tested, violations resolved

### Week 4: Enforcement & Monitoring
- **Day 1**: Switch to enforced mode in development
- **Days 2-3**: Final testing, performance benchmarking
- **Day 4**: Production deployment (staged)
- **Day 5**: Intensive monitoring
- **Milestone**: CSP enforced in production

---

## Resource Requirements

### Development Team
- **1 Senior Frontend Developer**: Lead implementation (full-time, 3 weeks)
- **1 QA Engineer**: Testing and validation (part-time, 2 weeks)
- **1 DevOps Engineer**: Build configuration, deployment (part-time, 1 week)

### Tools & Services
- **Lighthouse**: Security audits (free)
- **CSP Evaluator**: Policy validation (free, https://csp-evaluator.withgoogle.com/)
- **Browser DevTools**: Violation monitoring (free)

### Infrastructure
- **Staging Environment**: For testing CSP before production
- **Monitoring**: CSP violation reporting endpoint (optional, future)

---

## Dependencies

### External Dependencies
- ✅ Vite 4+ (already installed)
- ✅ React 18 (already installed)
- ⚠️ vite-plugin-html (need to install)
- ⚠️ pdfjs-dist (need to install, if using PDF.js option)

### Internal Dependencies
- ✅ All existing features must continue working
- ✅ Firebase integration must not break
- ✅ Offline-first architecture must be maintained

---

## Acceptance Criteria

### Must Have (P0)
- [ ] No CSP violations in production for 1 week
- [ ] All existing features work identically
- [ ] Lighthouse security score 90+
- [ ] No `unsafe-eval` in production script-src
- [ ] Cross-browser compatibility (Chrome, Firefox, Edge)
- [ ] Performance degradation < 5%

### Should Have (P1)
- [ ] No `unsafe-inline` in script-src
- [ ] File download security improvements
- [ ] PDF preview with PDF.js (not iframe data URLs)
- [ ] CSP policy documentation complete

### Nice to Have (P2)
- [ ] Nonce-based CSP for styles
- [ ] Self-hosted fonts (eliminate external font-src)
- [ ] CSP violation reporting endpoint
- [ ] Automated CSP testing in CI/CD

---

## Future Enhancements

### Phase 6: Advanced CSP (Future)

#### 6.1: Nonce-Based CSP for Styles
- Generate random nonce at build time
- Inject nonce into inline styles
- Remove `unsafe-inline` from style-src

#### 6.2: Self-Hosted Fonts
- Download Google Fonts and host locally
- Remove external font-src directive
- Improve performance (no external requests)

#### 6.3: CSP Reporting API
- Set up CSP violation reporting endpoint
- Aggregate violations for analysis
- Alert on new violation types

#### 6.4: Subresource Integrity (SRI)
- Add integrity hashes for CDN resources
- Protect against CDN compromise
- Automated SRI hash generation in build

---

## Conclusion

This implementation plan provides a comprehensive, phased approach to implementing Content Security Policy in the Construction Billing Software. By following this plan:

1. **Security**: Application will be protected against XSS and code injection attacks
2. **Compatibility**: All existing features will continue working
3. **Performance**: Minimal impact on application performance
4. **Maintainability**: Clean, documented CSP configuration
5. **Future-Ready**: Foundation for advanced security features

**Recommended Next Steps**:
1. Review and approve this plan
2. Allocate team resources
3. Set up staging environment
4. Begin Phase 1 implementation

**Estimated Total Effort**: 2-3 weeks (1 senior developer full-time)
**Risk Level**: LOW (with proper testing and staged rollout)
**Impact**: HIGH (significant security improvement)

---

## Appendix

### A. CSP Directives Reference

| Directive | Purpose | Recommended Value |
|-----------|---------|-------------------|
| default-src | Fallback for unspecified directives | 'self' |
| script-src | JavaScript sources | 'self' + trusted CDNs |
| style-src | CSS sources | 'self' 'unsafe-inline' + font CDNs |
| font-src | Font sources | 'self' + Google Fonts |
| img-src | Image sources | 'self' data: https: |
| connect-src | AJAX, WebSocket, EventSource | 'self' + Firebase domains |
| frame-src | iframe sources | 'self' (no data: if possible) |
| worker-src | Web Workers, Service Workers | 'self' blob: |
| object-src | <object>, <embed>, <applet> | 'none' |
| base-uri | <base> tag | 'self' |
| form-action | Form submission targets | 'self' |
| frame-ancestors | Can embed this page | 'none' (prevent clickjacking) |

### B. Testing URLs

**CSP Evaluator**: https://csp-evaluator.withgoogle.com/
**CSP Documentation**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
**CSP Validator**: https://cspvalidator.org/

### C. Useful Commands

```bash
# Build and test CSP locally
npm run build
npm run preview

# Check for inline scripts (should be 0)
grep -r "onClick=" src/ | grep -v "onClick={" | wc -l

# Find data URLs
grep -r "data:image" src/ --include="*.jsx"

# Monitor CSP violations in development
# Open DevTools Console and filter for "CSP"
```

### D. Contact & Support

**Implementation Lead**: [To be assigned]
**Security Review**: [To be assigned]
**Questions**: Create issue in project repository

---

**Document Version**: 1.0
**Last Updated**: 2025-12-05
**Status**: Draft - Awaiting Approval
