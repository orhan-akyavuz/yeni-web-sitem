// backend/ingest/scheduler.js
// Opt-in interval scheduler. Production can use an external scheduler instead;
// this is deliberately disabled unless INGEST_INTERVAL_MINUTES is configured.
import { runAll } from './collector.js';

export function startIngestScheduler() {
  const minutes = Number(process.env.INGEST_INTERVAL_MINUTES || 0);
  if (!Number.isFinite(minutes) || minutes < 1) return null;

  let running = false;
  const execute = async () => {
    if (running) return;
    running = true;
    try {
      const results = await runAll();
      console.info(JSON.stringify({ level: 'info', module: 'ingest', event: 'completed', results }));
    } catch (error) {
      console.error(JSON.stringify({ level: 'error', module: 'ingest', event: 'run-failed', message: error.message }));
    } finally {
      running = false;
    }
  };

  const timer = setInterval(execute, minutes * 60_000);
  timer.unref();
  console.info(`[ingest] Scheduler enabled: every ${minutes} minute(s).`);
  return { stop: () => clearInterval(timer), execute };
}
