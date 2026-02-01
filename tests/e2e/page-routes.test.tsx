/**
 * Page Route Existence Tests
 *
 * Verify that all required page route files exist to prevent 404 errors.
 * This test type is crucial because component/API tests don't catch missing route files.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Page Route Existence', () => {
  const appDir = join(process.cwd(), 'app', '(dashboard)', 'clients', '[id]');

  describe('Consultation Feature Pages', () => {
    it('should have consultations list page', () => {
      const pagePath = join(appDir, 'consultations', 'page.tsx');
      expect(existsSync(pagePath), `Consultations list page not found at ${pagePath}`).toBe(true);
    });

    it('should have new consultation page', () => {
      const pagePath = join(appDir, 'consultations', 'new', 'page.tsx');
      expect(existsSync(pagePath), `New consultation page not found at ${pagePath}`).toBe(true);
    });

    it('should have consultation detail page', () => {
      const pagePath = join(appDir, 'consultations', '[consultationId]', 'page.tsx');
      expect(existsSync(pagePath), `Consultation detail page not found at ${pagePath}`).toBe(true);
    });
  });

  describe('Client Feature Pages', () => {
    it('should have client detail page', () => {
      const pagePath = join(appDir, 'page.tsx');
      expect(existsSync(pagePath), `Client detail page not found at ${pagePath}`).toBe(true);
    });

    it('should have client edit page', () => {
      const pagePath = join(appDir, 'edit', 'page.tsx');
      expect(existsSync(pagePath), `Client edit page not found at ${pagePath}`).toBe(true);
    });
  });

  describe('API Routes Existence', () => {
    const apiDir = join(process.cwd(), 'app', 'api', 'clients', '[id]');

    it('should have consultations API route', () => {
      const routePath = join(apiDir, 'consultations', 'route.ts');
      expect(existsSync(routePath), `Consultations API route not found at ${routePath}`).toBe(true);
    });

    it('should have consultation detail API route', () => {
      const routePath = join(apiDir, 'consultations', '[consultationId]', 'route.ts');
      expect(existsSync(routePath), `Consultation detail API route not found at ${routePath}`).toBe(true);
    });

    it('should have consultation analyze API route', () => {
      const routePath = join(apiDir, 'consultations', '[consultationId]', 'analyze', 'route.ts');
      expect(existsSync(routePath), `Consultation analyze API route not found at ${routePath}`).toBe(true);
    });
  });
});

/**
 * REFLECTION: Why Tests Didn't Catch Missing Pages
 *
 * PROBLEM:
 * The consultation feature had all components and API routes tested,
 * but the actual page routes were missing, causing 404 errors when users
 * tried to access /clients/[id]/consultations/new
 *
 * ROOT CAUSE:
 * 1. Test Isolation - Tests focused on individual components and API endpoints
 * 2. Missing Integration - No tests verified the complete navigation flow
 * 3. Mock Overuse - E2E tests mocked the router, so actual routes weren't exercised
 * 4. Assumption Gap - Assumed that if components and APIs work, pages must exist
 *
 * WHAT WAS TESTED:
 * ✅ ConsultationForm component
 * ✅ VoiceRecorder component
 * ✅ useVoiceRecording hook
 * ✅ POST /api/clients/[id]/consultations
 * ✅ GET /api/clients/[id]/consultations
 * ✅ PUT/DELETE /api/clients/[id]/consultations/[consultationId]
 * ✅ AI analysis endpoint
 *
 * WHAT WASN'T TESTED:
 * ❌ Page route file existence
 * ❌ Navigation links working end-to-end
 * ❌ Actual URL accessibility
 * ❌ File system structure validation
 *
 * SOLUTION - New Test Type Added:
 * - Page route existence tests (this file)
 * - Verify file structure matches expected routes
 * - Prevent 404s from missing route files
 *
 * LESSONS LEARNED:
 * 1. Component tests ≠ Page tests
 * 2. API tests ≠ Route tests
 * 3. Always verify file system structure for new features
 * 4. Add "smoke tests" that check page accessibility
 * 5. Don't rely solely on component-level testing
 *
 * FUTURE PREVENTION:
 * - Add page route existence check to feature completion checklist
 * - Include route verification in E2E tests (no router mocking)
 * - Create a "build verification" test that checks all routes are accessible
 * - Use tools like `next-routes` to validate route structure
 */
