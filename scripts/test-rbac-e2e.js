/**
 * E2E Test Suite for Enterprise Role-Based Access Control (RBAC)
 */

const BASE_URL = process.env.API_URL || 'http://localhost:8080/api';

async function runTests() {
  console.log('======================================================');
  console.log('  EXOIN AFRICA - ENTERPRISE RBAC E2E TEST RUNNER');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Admin
    console.log('1. Admin Authentication:');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@exoinafrica.com', password: 'Admin@123' })
    });
    const adminData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin Login Status 200');
    assert(!!adminData.token, 'JWT Token Issued');
    assert(Array.isArray(adminData.user.permissions), 'User permissions array included in login payload');
    assert(adminData.user.permissions.includes('*'), 'Admin user has wildcard (*) permission');
    const adminToken = adminData.token;
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // 2. Fetch Permission Catalog
    console.log('\n2. Permission Catalog:');
    const permRes = await fetch(`${BASE_URL}/rbac/permissions`, { headers: adminHeaders });
    const permData = await permRes.json();
    assert(permRes.status === 200, 'Fetch Permissions Catalog Status 200');
    assert(Array.isArray(permData.permissions) && permData.permissions.length >= 18, 'Catalog has complete permission set');
    assert(permData.categories.includes('Identity & Access'), 'Contains Identity & Access category');
    assert(permData.categories.includes('Finance & Operations'), 'Contains Finance & Operations category');

    // 3. Fetch Role-Permission Matrix
    console.log('\n3. Role-Permission Matrix:');
    const matrixRes = await fetch(`${BASE_URL}/rbac/matrix`, { headers: adminHeaders });
    const matrixData = await matrixRes.json();
    assert(matrixRes.status === 200, 'Fetch Role Matrix Status 200');
    assert(!!matrixData.matrix.ADMIN, 'Admin role present in matrix');
    assert(!!matrixData.matrix.MANAGER, 'Manager role present in matrix');
    assert(!!matrixData.matrix.STAFF, 'Staff role present in matrix');
    assert(!!matrixData.matrix.FINANCE, 'Finance role present in matrix');
    assert(!!matrixData.matrix.AUDITOR, 'Auditor role present in matrix');
    assert(matrixData.matrix.STAFF.includes('finance:job_cards:manage'), 'Staff has job cards manage permission');
    assert(!matrixData.matrix.STAFF.includes('users:roles:manage'), 'Staff does not have roles manage permission');

    // 4. Update Role Matrix
    console.log('\n4. Role Matrix Mutation (Admin Only):');
    const updateRoleRes = await fetch(`${BASE_URL}/rbac/matrix`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        role: 'STAFF',
        permissions: [
          'users:read',
          'documents:read',
          'documents:sign',
          'finance:job_cards:read',
          'finance:job_cards:manage',
          'finance:delivery_notes:manage',
          'mail:read',
          'mail:send',
          'documents:create' // Added documents:create capability
        ]
      })
    });
    const updateRoleData = await updateRoleRes.json();
    assert(updateRoleRes.status === 200, 'Update Role Matrix Status 200');
    assert(updateRoleData.permissions.includes('documents:create'), 'Role permissions successfully updated');

    // Reset Staff Role back to default
    const resetRes = await fetch(`${BASE_URL}/rbac/matrix/reset`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ role: 'STAFF' })
    });
    assert(resetRes.status === 200, 'Reset Role Matrix Status 200');

    // 5. User Effective Permissions & Custom Overrides
    console.log('\n5. User Effective Permissions & Custom Overrides:');
    const userPermsRes = await fetch(`${BASE_URL}/rbac/users/${adminData.user.id}/permissions`, {
      headers: adminHeaders
    });
    const userPermsData = await userPermsRes.json();
    assert(userPermsRes.status === 200, 'Fetch User Permissions Status 200');
    assert(userPermsData.effectivePermissions.includes('*'), 'Admin effective permissions verified');

    // 6. Non-Admin (Staff) Access Control Check
    console.log('\n6. Non-Admin Policy Enforcement (Least Privilege):');
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'peter@exoinafrica.com', password: 'Staff@123' })
    });
    const staffData = await staffLoginRes.json();
    assert(staffLoginRes.status === 200, 'Staff Login Status 200');
    assert(!staffData.user.permissions.includes('*'), 'Staff user does not have wildcard');
    assert(staffData.user.permissions.includes('finance:job_cards:manage'), 'Staff has field technician permissions');

    const staffHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffData.token}`
    };

    // Staff attempting to access admin-only RBAC mutation
    const staffRbacAttempt = await fetch(`${BASE_URL}/rbac/matrix`, {
      method: 'PUT',
      headers: staffHeaders,
      body: JSON.stringify({ role: 'STAFF', permissions: ['*'] })
    });
    assert(staffRbacAttempt.status === 403, 'Staff RBAC mutation rejected with Status 403 (Forbidden)');

    // 7. Dynamic User Custom Permission Override
    console.log('\n7. Dynamic User Custom Permission Override:');
    // Grant Peter (Staff) specific override: 'finance:quotations:manage'
    const grantOverrideRes = await fetch(`${BASE_URL}/rbac/users/${staffData.user.id}/permissions`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ customPermissions: ['finance:quotations:manage'] })
    });
    const grantOverrideData = await grantOverrideRes.json();
    assert(grantOverrideRes.status === 200, 'Custom Permission Override Granted Status 200');
    assert(grantOverrideData.customPermissions.includes('finance:quotations:manage'), 'Override recorded in database');
    assert(grantOverrideData.effectivePermissions.includes('finance:quotations:manage'), 'Effective permissions reflect override');

    // Clean up Peter's custom permissions
    await fetch(`${BASE_URL}/rbac/users/${staffData.user.id}/permissions`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ customPermissions: [] })
    });
    console.log('  ✔ User custom permissions cleaned up gracefully');

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
