/**
 * Integration Test Suite
 *
 * This script runs all test modules in sequence and provides
 * a comprehensive test report.
 *
 * Test Modules:
 * 1. Wrapper Tests
 * 2. Assets Tests
 * 3. DEX Tests
 * 4. End-to-End Swap Tests
 *
 * Usage:
 * 1. Set PRIVATE_KEY in .env file
 * 2. Run: pnpm test:integration
 */

import { spawn } from 'child_process';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ==================== Configuration ====================

interface TestModule {
  name: string;
  file: string;
  description: string;
  required: boolean;
}

const TEST_MODULES: TestModule[] = [
  {
    name: 'Wrapper Tests',
    file: 'test-wrapper-complete.ts',
    description: 'Tests wrap/unwrap functionality',
    required: true
  },
  {
    name: 'Assets Tests',
    file: 'test-assets-complete.ts',
    description: 'Tests asset management and transfers',
    required: true
  },
  {
    name: 'DEX Tests',
    file: 'test-dex-complete.ts',
    description: 'Tests pool creation, liquidity, and swaps',
    required: true
  },
  {
    name: 'E2E Swap Tests',
    file: 'test-swap-e2e.ts',
    description: 'Tests complete swap application flow',
    required: true
  }
];

// ==================== Helper Functions ====================

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.error(`❌ ${message}`);
}

function logInfo(key: string, value: any) {
  console.log(`   ${key}: ${value}`);
}

function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

// ==================== Test Execution ====================

interface TestResult {
  module: string;
  passed: boolean;
  duration: number;
  error?: string;
}

async function runTestModule(module: TestModule): Promise<TestResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, module.file);

    console.log(`\n▶️  Running: ${module.name}`);
    console.log(`   Description: ${module.description}`);
    console.log(`   File: ${module.file}\n`);

    const testProcess = spawn('tsx', [scriptPath], {
      stdio: 'inherit',
      env: process.env
    });

    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;

      if (code === 0) {
        resolve({
          module: module.name,
          passed: true,
          duration
        });
      } else {
        resolve({
          module: module.name,
          passed: false,
          duration,
          error: `Process exited with code ${code}`
        });
      }
    });

    testProcess.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        module: module.name,
        passed: false,
        duration,
        error: error.message
      });
    });
  });
}

// ==================== Main Integration Test ====================

async function main() {
  logSection('Merak SDK Integration Test Suite');

  // Check environment
  if (!process.env.PRIVATE_KEY) {
    logError('PRIVATE_KEY environment variable not set');
    console.log('Please set PRIVATE_KEY in .env file');
    process.exit(1);
  }

  logSuccess('Environment check passed');
  console.log(`\n📋 Test Modules to Run: ${TEST_MODULES.length}`);
  TEST_MODULES.forEach((module, index) => {
    console.log(`   ${index + 1}. ${module.name}`);
    console.log(`      ${module.description}`);
  });

  // Run all tests
  const results: TestResult[] = [];
  const overallStartTime = Date.now();

  for (const module of TEST_MODULES) {
    const result = await runTestModule(module);
    results.push(result);

    // Log individual result
    if (result.passed) {
      logSuccess(`${module.name} - PASSED (${(result.duration / 1000).toFixed(2)}s)`);
    } else {
      logError(`${module.name} - FAILED (${(result.duration / 1000).toFixed(2)}s)`);
      if (result.error) {
        console.error(`   Error: ${result.error}`);
      }

      // Stop if required test fails
      if (module.required) {
        logError('Required test failed. Stopping integration test.');
        break;
      }
    }
  }

  const overallDuration = Date.now() - overallStartTime;

  // ==================== Test Report ====================
  logSection('Integration Test Report');

  // Summary statistics
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(2);

  console.log('\n📊 Summary:');
  logInfo('Total Tests Run', totalTests);
  logInfo('Passed', passedTests);
  logInfo('Failed', failedTests);
  logInfo('Pass Rate', `${passRate}%`);
  logInfo('Total Duration', `${(overallDuration / 1000).toFixed(2)}s`);

  // Detailed results
  console.log('\n📋 Detailed Results:\n');
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`   ${index + 1}. ${result.module}`);
    console.log(`      Status: ${status}`);
    console.log(`      Duration: ${duration}s`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
    console.log();
  });

  // Coverage summary
  logSection('Test Coverage Summary');

  console.log('\n✅ Tested Functionality:\n');
  console.log('   Wrapper System:');
  console.log('   ✅ Wrap native tokens to Merak assets');
  console.log('   ✅ Unwrap Merak assets to native tokens');
  console.log('   ✅ Balance verification');

  console.log('\n   Assets System:');
  console.log('   ✅ Asset transfers');
  console.log('   ✅ Balance queries');
  console.log('   ✅ Metadata queries');
  console.log('   ✅ Supply queries');
  console.log('   ✅ Asset listing');

  console.log('\n   DEX System:');
  console.log('   ✅ Pool creation');
  console.log('   ✅ Add liquidity');
  console.log('   ✅ Remove liquidity');
  console.log('   ✅ Swap exact input');
  console.log('   ✅ Swap exact output');
  console.log('   ✅ Amount calculations');

  console.log('\n   End-to-End Scenarios:');
  console.log('   ✅ Complete swap user flow');
  console.log('   ✅ Multi-step transactions');
  console.log('   ✅ Slippage protection');
  console.log('   ✅ Portfolio management');

  console.log('\n⚠️  Not Tested (Requires Special Permissions):\n');
  console.log('   - Asset minting (owner only)');
  console.log('   - Asset burning (owner only)');
  console.log('   - Address freezing (owner only)');
  console.log('   - Metadata updates (owner only)');
  console.log('   - Wrapper registration (package only)');

  // Final verdict
  logSection('Final Verdict');

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed successfully!\n');
    console.log('The Merak SDK is functioning correctly across all tested modules.');
    console.log('All core business flows have been verified.');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed.\n`);
    console.log('Please review the errors above and fix the issues.');
    console.log('Some functionality may not be working as expected.');
    process.exit(1);
  }
}

// ==================== Error Handling ====================

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled Promise rejection:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Integration test interrupted by user');
  process.exit(130);
});

// ==================== Execution ====================

main().catch((error) => {
  console.error('\n❌ Integration test execution failed:', error.message);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
});

