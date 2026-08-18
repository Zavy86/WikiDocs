import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const reportDirectory = resolve(process.argv[2] ?? 'test-results');

const readJson = async (filename) => JSON.parse(await readFile(resolve(reportDirectory, filename), 'utf8'));

const readTap = async (filename) => {
  const report = await readFile(resolve(reportDirectory, filename), 'utf8');
  const readMetric = (name) => Number(report.match(new RegExp(`^# ${name} (\\d+)$`, 'm'))?.[1] ?? 0);

  return {
    testFiles: readMetric('tests'),
    passed: readMetric('pass'),
    failed: readMetric('fail'),
  };
};

const formatStatus = (failed) => (failed === 0 ? '✅' : '❌');

const backend = await readJson('backend.json');
const frontend = await readJson('frontend.json');
const desktop = await readTap('desktop.tap');
const results = [
  {
    name: 'Backend E2E',
    testFiles: backend.testResults.length,
    passed: backend.numPassedTests,
    failed: backend.numFailedTests,
  },
  {
    name: 'Frontend',
    testFiles: frontend.testResults.length,
    passed: frontend.numPassedTests,
    failed: frontend.numFailedTests,
  },
  {
    name: 'Desktop',
    ...desktop,
  },
];
const total = results.reduce((summary, result) => ({
  testFiles: summary.testFiles + result.testFiles,
  passed: summary.passed + result.passed,
  failed: summary.failed + result.failed,
}), { testFiles: 0, passed: 0, failed: 0 });
const lines = [
  '## Test report',
  '',
  '| Suite | File | Passed | Failed | Status |',
  '| --- | ---: | ---: | ---: | --- |',
  ...results.map((result) => `| ${result.name} | ${result.testFiles} | ${result.passed} | ${result.failed} | ${formatStatus(result.failed)} |`),
  `| **Total** | **${total.testFiles}** | **${total.passed}** | **${total.failed}** | ${formatStatus(total.failed)} |`,
  '',
];
const summary = `${lines.join('\n')}\n`;

if (process.env.GITHUB_STEP_SUMMARY) {
  await import('node:fs/promises').then(({ appendFile }) => appendFile(process.env.GITHUB_STEP_SUMMARY, summary));
}

process.stdout.write(summary);
