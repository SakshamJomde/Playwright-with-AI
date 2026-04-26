import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

// Matches: locator('button.old-cls') or Unable to locate element '.old-cls'
const LOCATOR_ERROR_RE = /locator\(['"`](.+?)['"`]\)|Unable to locate element.*?['"`](.+?)['"`]/;

export default class SelfHealingReporter implements Reporter {
  private broken: Array<{ file: string; selector: string }> = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status !== 'failed') return;

    const selector = extractBrokenLocator(result);
    if (!selector) return;

    const file = test.location.file;
    this.broken.push({ file, selector });
    console.log(`\n[SelfHealer] Broken selector detected in ${file}: "${selector}"`);
    console.log(`[SelfHealer] Add ANTHROPIC_API_KEY to .env to enable auto-healing.`);
  }

  onEnd(): void {
    if (this.broken.length === 0) return;
    console.log('\n[SelfHealer] Broken selectors this run:');
    for (const b of this.broken) {
      console.log(`  ${b.file} → "${b.selector}"`);
    }
  }
}

function extractBrokenLocator(result: TestResult): string | null {
  const msg = result.error?.message ?? '';
  const match = msg.match(LOCATOR_ERROR_RE);
  return match?.[1] ?? match?.[2] ?? null;
}
