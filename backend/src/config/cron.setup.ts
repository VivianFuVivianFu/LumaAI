/**
 * Cron Job Setup for Langfuse Background Workers
 *
 * Schedule:
 * - Metrics Rollup: Every hour
 * - Quality Evaluator: Every 6 hours
 */

import cron from 'node-cron';
import { runLangfuseMetricsRollup } from '../workers/langfuse-metrics-rollup.worker';
import { runLangfuseQualityEvaluator } from '../workers/langfuse-quality-evaluator.worker';

/**
 * Initialize all background cron jobs
 */
export function initializeCronJobs() {
  console.log('[Cron] Initializing Langfuse background workers...');

  // Metrics Rollup: Every hour at minute 0
  // Cron format: minute hour day month dayOfWeek
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[Cron] Running Langfuse metrics rollup...');
      await runLangfuseMetricsRollup();
      console.log('[Cron] Metrics rollup completed');
    } catch (error) {
      console.error('[Cron] Metrics rollup failed:', error);
    }
  });

  // Quality Evaluator: Every 6 hours at minute 0
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('[Cron] Running Langfuse quality evaluator...');
      await runLangfuseQualityEvaluator();
      console.log('[Cron] Quality evaluator completed');
    } catch (error) {
      console.error('[Cron] Quality evaluator failed:', error);
    }
  });

  console.log('[Cron] Background workers initialized:');
  console.log('  - Metrics Rollup: Every hour (0 * * * *)');
  console.log('  - Quality Evaluator: Every 6 hours (0 */6 * * *)');
}

/**
 * Manually trigger metrics rollup (for testing/debugging)
 */
export async function manualMetricsRollup() {
  console.log('[Manual] Running metrics rollup...');
  await runLangfuseMetricsRollup();
  console.log('[Manual] Metrics rollup complete');
}

/**
 * Manually trigger quality evaluator (for testing/debugging)
 */
export async function manualQualityEval() {
  console.log('[Manual] Running quality evaluator...');
  await runLangfuseQualityEvaluator();
  console.log('[Manual] Quality evaluator complete');
}
