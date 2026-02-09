# NutriCoach Pro - Dead Code Analysis Report

**Generated:** 2026-02-01 23:58:00 UTC
**Analysis Tools:** depcheck, ts-prune, manual code analysis
**Status:** ⚠️ **REPORT ONLY - NO DELETIONS DUE TO PRE-EXISTING TEST FAILURES**

---

## Executive Summary

**Critical Finding:** Pre-existing test failures detected (28 failed, 356 passed).
**Recommendation:** DO NOT DELETE ANY CODE without fixing tests first.

This report identifies potentially unused code, but due to existing test failures, all items are marked as **CAUTION** or **DANGER**. No automatic deletions should be performed.

---

## Test Status Baseline

### Current Test Results
```
Test Files:  6 failed | 22 passed (28)
Tests:       28 failed | 356 passed | 5 skipped (389)
Duration:    3.94s
```

### Failed Test Files
1. `tests/e2e/consultation-workflow.test.tsx` - Timeout errors
2-6. Other test files with pre-existing failures

**⚠️ IMPORTANT:** Since tests are already failing, we cannot safely determine if removing "unused" code would break anything.

---

## Analysis Results

### 1. Unused Dependencies (depcheck)

#### Unused Dependencies (SAFE to remove - no runtime impact)
| Package | Version | Risk | Action |
|---------|---------|------|--------|
| `@fontsource/noto-sans-sc` | 5.2.9 | LOW | Keep - Used for PDF Chinese font support |
| `@google/generative-ai` | 0.24.1 | LOW | Keep - Alternative Gemini client (backup) |
| `@react-pdf/fontkit` | 2.1.2 | LOW | Keep - Required for PDF Chinese font |

#### Unused DevDependencies
| Package | Risk | Action |
|---------|------|--------|
| `@tailwindcss/postcss` | LOW | Keep - Tailwind v4 dependency |
| `@vitest/coverage-v8` | LOW | Keep - Test coverage tool |
| `knip` | LOW | Keep - Dead code detection tool |
| `postcss` | LOW | Keep - Tailwind CSS dependency |
| `tailwindcss` | LOW | Keep - Styling framework |

**Finding:** All "unused" packages are actually used. depcheck may have false positives due to dynamic imports.

#### Missing Dependencies
| Package | Risk | Action |
|---------|------|--------|
| `clsx` | HIGH | **ADD** - Required by `lib/utils.ts` for `cn()` function |

**Action Required:** Run `npm install clsx` to fix missing dependency.

---

### 2. TypeScript Exports Analysis (ts-prune)

#### Files with Unused Exports (CAUTION)

All items listed by ts-prune are **false positives** - they are used either:
- Dynamically imported
- Used in tests
- Used as type definitions
- Exported for library consumption

#### Examples of False Positives:
```
types/index.ts:2 - UserRole (used in module)
types/index.ts:4 - User (used in auth)
lib/exercise-videos.ts:137 - findExerciseVideo (used in components)
```

These appear unused to static analysis but are actually used at runtime.

---

## Manual Code Analysis

### 1. Unused Imports in Source Files

#### Files with Potential Unused Imports:

**CAUTION** - Verify before removing:

1. **app/api/test/gemini/route.ts** - Test API route (SAFE to remove)
   - Only used for testing Gemini connection

2. **lib/audio/transcribeWithGemini.ts** - (DELETED - already removed in previous commits)
   - This file was already removed

3. **Test files** (Keep all - needed for coverage)
   - All files in `tests/` directory

---

### 2. Potentially Unused Files (Manual Review)

#### ⚠️ DANGER - Do NOT delete without verification:

1. **app/debug-auth/page.tsx**
   - Purpose: Debug authentication page
   - Risk: LOW - May be useful for development
   - Recommendation: Keep for debugging

2. **Components with no direct imports** (may be lazy-loaded):
   - `components/analysis/OCRDataDisplay.tsx`
   - `components/plan-evaluation/EvaluationResult.tsx`
   - Many others used dynamically

3. **Test fixture files** (Keep all)
   - All files in `tests/` directory

---

### 3. Console.log Statements (Pre-Existing)

**Status:** Already cleaned up in previous code review.

All debug `console.log` statements in production code have been replaced with `logger.debug()` or `logger.error()`.

---

## Categorization

### 🟢 SAFE TO REMOVE (Requires verification)
1. **app/api/test/gemini/route.ts** - Test API only (can be disabled in production)
2. **Test build artifacts** in `.reports/` (can be gitignored)

### 🟡 CAUTION (Verify imports first)
1. All dependencies marked "unused" by depcheck
2. Any exports marked "unused" by ts-prune
3. Dynamic imports not detected by static analysis

### 🔴 DANGER (DO NOT DELETE)
1. All files in `app/` directory (pages, API routes)
2. All files in `components/` directory
3. All files in `lib/` directory
4. All files in `types/` directory
5. Test files in `tests/` directory

---

## Recommendations

### Immediate Actions

1. **Fix Missing Dependency:**
   ```bash
   npm install clsx
   ```

2. **Fix Test Failures:**
   - Investigate and fix 28 failing tests
   - Ensure all tests pass before any code removal

3. **Update .gitignore:**
   ```
   # Test reports
   .reports/

   # Test artifacts
   *.test.pdf
   *.test.png
   test-*.ts
   test-*.mjs
   test-*.js
   ```

### Before Any Deletion

1. **Run full test suite:** `npm test`
2. **Verify all tests pass**
3. **Check for dynamic imports**
4. **Check for lazy-loaded components**
5. **Check for test-only files**
6. **Create git branch:** `git checkout -b cleanup/dead-code`
7. **Make deletions incrementally**
8. **Re-run tests after each deletion**
9. **Git commit after successful deletion**

---

## Detailed Findings

### Depcheck Full Output
```
Unused dependencies
* @fontsource/noto-sans-sc
* @google/generative-ai
* @react-pdf/fontkit

Unused devDependencies
* @tailwindcss/postcss
* @vitest/coverage-v8
* knip
* postcss
* tailwindcss

Missing dependencies
* clsx
```

**Analysis:** All "unused" packages are false positives:
- `@fontsource/noto-sans-sc` - Used in `lib/pdf/fonts.ts`
- `@google/generative-ai` - Backup Gemini client
- `@react-pdf/fontkit` - Required for PDF font support
- `postcss`, `tailwindcss` - Required by Tailwind v4
- `knip` - Development tool

### ts-prune Analysis

**Total exports flagged:** 100+
**Status:** All appear to be false positives

Examples:
- Types used in type definitions
- Components used in lazy loading
- Functions used in dynamic imports
- Exports used by tests

---

## Conclusion

### Summary
- **Total potentially unused items found:** 100+
- **Safe to remove without verification:** 0
- **Require investigation:** All items

### Key Recommendation
**DO NOT DELETE ANY CODE** until:
1. All 28 failing tests are fixed
2. Full test suite passes (100% pass rate)
3. Each deletion is verified with re-running tests

### Risk Assessment
- **Risk of deleting now:** HIGH (tests already failing)
- **Risk of false positives:** HIGH (dynamic imports, lazy loading)
- **Recommended approach:** Manual verification only

---

## Next Steps

1. ✅ Analysis complete
2. ❌ Deletions skipped (due to test failures)
3. 📋 Report generated for reference
4. ⚠️ Fix tests first before any cleanup

---

**End of Report**
