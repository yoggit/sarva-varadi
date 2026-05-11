import { BaseConverter } from './base-converter';
import { SarvaTestResult, TestStep } from '../types';

/**
 * Converts Cucumber JSON format to Sarva-Varadi format
 */
export class CucumberConverter extends BaseConverter {
  convert(data: any): SarvaTestResult[] {
    const results: SarvaTestResult[] = [];

    if (!Array.isArray(data)) return results;

    for (const feature of data) {
      const featureName = feature.name || 'Unknown Feature';
      const featureTags = this.extractTags(feature.tags);
      const elements = feature.elements || [];

      for (const scenario of elements) {
        const scenarioName = scenario.name || 'Unknown Scenario';
        const scenarioType = scenario.type || 'scenario';
        const scenarioTags = [...featureTags, ...this.extractTags(scenario.tags)];
        const steps = scenario.steps || [];

        let totalDuration = 0;
        let status: 'passed' | 'failed' | 'skipped' = 'passed';
        let errorMessage: string | undefined;
        let startTime = 0;

        const testSteps: TestStep[] = [];

        for (const step of steps) {
          const stepName = `${step.keyword}${step.name}`;
          const stepResult = step.result || {};
          const stepStatus = stepResult.status || 'passed';
          const stepDuration = stepResult.duration ? stepResult.duration / 1000000 : 0; // Convert nanoseconds to ms

          totalDuration += stepDuration;

          if (!startTime && step.result?.start_timestamp) {
            startTime = step.result.start_timestamp;
          }

          const stepStart = Date.now() - totalDuration;
          const stepStop = stepStart + stepDuration;

          const testStep: TestStep = {
            name: stepName,
            status: this.mapStatus(stepStatus),
            start: stepStart,
            stop: stepStop,
            duration: stepDuration,
          };

          // Check for error
          if (stepStatus === 'failed') {
            status = 'failed';
            errorMessage = stepResult.error_message || 'Step failed';
          } else if (stepStatus === 'skipped' || stepStatus === 'pending' || stepStatus === 'undefined') {
            if (status === 'passed') {
              status = 'skipped';
            }
          }

          testSteps.push(testStep);
        }

        const start = startTime || Date.now() - totalDuration;
        const stop = start + totalDuration;

        const result: SarvaTestResult = {
          uuid: this.generateUUID(),
          tool: 'cucumber',
          name: this.cleanTestName(scenarioName),
          fullName: `${featureName} > ${scenarioName}`,
          status,
          statusDetails: errorMessage ? {
            message: errorMessage,
          } : undefined,
          stage: 'finished',
          start,
          stop,
          duration: totalDuration,
          steps: testSteps,
          attachments: [],
          labels: scenarioTags.map(tag => ({ name: 'tag', value: tag })),
        };

        // Mark scenario outlines in extra field
        if (scenarioType === 'scenario_outline') {
          result.extra = { scenarioType: 'outline' };
        }

        results.push(result);
      }
    }

    return results;
  }

  private extractTags(tags: any[]): string[] {
    if (!Array.isArray(tags)) return [];
    return tags.map(tag => tag.name?.replace('@', '') || '').filter(Boolean);
  }
}
