import db from '../db/dexieDB';

/**
 * Diagnostic tool to check data in localStorage and Dexie
 * Call this from browser console: window.checkData()
 */
export const checkDataDiagnostics = async () => {
  console.log('🔍 ===== DATA DIAGNOSTICS =====');
  
  // Check localStorage
  console.log('\n📦 LOCALSTORAGE DATA:');
  const localStorageData = localStorage.getItem('bycodez_data');
  if (localStorageData) {
    try {
      const data = JSON.parse(localStorageData);
      console.log('  Users:', data.users?.length || 0);
      console.log('  Projects:', data.projects?.length || 0);
      console.log('  Invoices:', data.invoices?.length || 0);
      console.log('  Quotations:', data.quotations?.length || 0);
      
      if (data.users && data.users.length > 0) {
        console.log('\n  👥 Users in localStorage:');
        data.users.forEach(u => {
          console.log(`    - ${u.username} (ID: ${u.id}, Role: ${u.role})`);
        });
      }
      
      if (data.projects && data.projects.length > 0) {
        console.log('\n  🏗️ Projects in localStorage:');
        data.projects.forEach(p => {
          console.log(`    - ${p.name} (ID: ${p.id}, UserID: ${p.userId || 'NONE'})`);
        });
      }
    } catch (error) {
      console.error('  ❌ Error parsing localStorage data:', error);
    }
  } else {
    console.log('  ℹ️ No data in localStorage');
  }
  
  // Check Dexie
  console.log('\n💾 DEXIE (IndexedDB) DATA:');
  try {
    const [users, projects, invoices, quotations] = await Promise.all([
      db.users.toArray(),
      db.projects.toArray(),
      db.invoices.toArray(),
      db.quotations.toArray()
    ]);
    
    console.log('  Users:', users.length);
    console.log('  Projects:', projects.length);
    console.log('  Invoices:', invoices.length);
    console.log('  Quotations:', quotations.length);
    
    if (users.length > 0) {
      console.log('\n  👥 Users in Dexie:');
      users.forEach(u => {
        console.log(`    - ${u.username} (ID: ${u.id}, Role: ${u.role}, FirebaseUID: ${u.firebaseUid || 'NONE'})`);
      });
    }
    
    if (projects.length > 0) {
      console.log('\n  🏗️ Projects in Dexie:');
      projects.forEach(p => {
        console.log(`    - ${p.name} (ID: ${p.id}, UserID: ${p.userId || 'NONE'})`);
      });
    }
  } catch (error) {
    console.error('  ❌ Error reading Dexie data:', error);
  }
  
  // Check migration status
  console.log('\n🔄 MIGRATION STATUS:');
  const migrationCompleted = localStorage.getItem('bycodez_migration_completed');
  console.log('  Migration completed:', migrationCompleted === 'true' ? 'YES' : 'NO');
  
  // Check current user
  console.log('\n👤 CURRENT USER:');
  const currentUser = localStorage.getItem('bycodez_current_user');
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      console.log('  Username:', user.username);
      console.log('  User ID:', user.id);
      console.log('  Role:', user.role);
    } catch (error) {
      console.error('  ❌ Error parsing current user:', error);
    }
  } else {
    console.log('  ℹ️ No current user');
  }
  
  console.log('\n🔍 ===== END DIAGNOSTICS =====\n');
};

/**
 * Fix user ID associations for existing data
 * This will update all projects/invoices/etc to use the current user's ID
 */
export const fixUserIdAssociations = async (userId) => {
  if (!userId) {
    console.error('❌ No userId provided');
    console.log('💡 Usage: fixUserIds("USER_ID_HERE")');
    console.log('💡 Get the user ID from checkData() output');
    return;
  }

  console.log('🔧 Fixing user ID associations for userId:', userId);

  try {
    let updatedCount = 0;

    // Update all projects
    const projects = await db.projects.toArray();
    for (const project of projects) {
      if (!project.userId || project.userId !== userId) {
        await db.projects.update(project.id, { userId, synced: false, lastUpdated: new Date().toISOString() });
        console.log(`  ✅ Updated project: ${project.name}`);
        updatedCount++;
      }
    }

    // Update all invoices
    const invoices = await db.invoices.toArray();
    for (const invoice of invoices) {
      if (!invoice.userId || invoice.userId !== userId) {
        await db.invoices.update(invoice.id, { userId, synced: false, lastUpdated: new Date().toISOString() });
        console.log(`  ✅ Updated invoice: ${invoice.invoiceNumber}`);
        updatedCount++;
      }
    }

    // Update all quotations
    const quotations = await db.quotations.toArray();
    for (const quotation of quotations) {
      if (!quotation.userId || quotation.userId !== userId) {
        await db.quotations.update(quotation.id, { userId, synced: false, lastUpdated: new Date().toISOString() });
        console.log(`  ✅ Updated quotation: ${quotation.quotationNumber}`);
        updatedCount++;
      }
    }

    // Update all departments
    const departments = await db.departments.toArray();
    for (const dept of departments) {
      if (!dept.userId || dept.userId !== userId) {
        await db.departments.update(dept.id, { userId, synced: false, lastUpdated: new Date().toISOString() });
        console.log(`  ✅ Updated department: ${dept.name}`);
        updatedCount++;
      }
    }

    // Update all payments in
    const paymentsIn = await db.paymentsIn.toArray();
    for (const payment of paymentsIn) {
      if (!payment.userId || payment.userId !== userId) {
        await db.paymentsIn.update(payment.id, { userId, synced: false, lastUpdated: new Date().toISOString() });
        console.log(`  ✅ Updated payment in: ${payment.description}`);
        updatedCount++;
      }
    }

    // Update all payments out
    const paymentsOut = await db.paymentsOut.toArray();
    for (const payment of paymentsOut) {
      if (!payment.userId || payment.userId !== userId) {
        await db.paymentsOut.update(payment.id, { userId, synced: false, lastUpdated: new Date().toISOString() });
        console.log(`  ✅ Updated payment out: ${payment.description}`);
        updatedCount++;
      }
    }

    console.log(`✅ User ID associations fixed! Updated ${updatedCount} records.`);
    console.log('🔄 Please refresh the page to see the updated data.');
  } catch (error) {
    console.error('❌ Error fixing user ID associations:', error);
  }
};

// CSP Violation Monitoring (Development Only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.addEventListener('securitypolicyviolation', (e) => {
    console.error('🚨 CSP Violation:', {
      directive: e.violatedDirective,
      blocked: e.blockedURI,
      source: e.sourceFile,
      line: e.lineNumber,
      column: e.columnNumber,
      originalPolicy: e.originalPolicy
    });
  });

  console.log('🔒 CSP monitoring enabled. Violations will be logged to console.');
}

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  window.checkData = checkDataDiagnostics;
  window.fixUserIds = fixUserIdAssociations;
}

