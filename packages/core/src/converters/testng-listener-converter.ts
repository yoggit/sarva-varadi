import { BaseConverter } from './base-converter';
import { SarvaTestResult } from '../types';

/**
 * Converter for TestNG listener JSON format (from SarvaVaradiListener)
 * Handles test results collected by the TestNG listener
 */
export class TestNGListenerConverter extends BaseConverter {
  convert(data: any[]): SarvaTestResult[] {
    if (!Array.isArray(data)) {
      throw new Error('TestNG listener data must be an array');
    }

    return data.map(test => this.convertTest(test));
  }

  private convertTest(test: any): SarvaTestResult {
    const uuid = this.generateUUID();
    const duration = test.endTime - test.startTime;

    // Map TestNG status to Sarva-Varadi status
    let status: 'passed' | 'failed' | 'skipped' | 'broken' | 'flaky';
    if (test.status === 'FLAKY') {
      status = 'flaky';
    } else if (test.status === 'PASS') {
      status = 'passed';
    } else if (test.status === 'FAIL') {
      status = test.error?.message?.includes('AssertionError') ? 'failed' : 'broken';
    } else if (test.status === 'SKIP') {
      status = 'skipped';
    } else {
      status = 'broken';
    }

    // Convert API calls to steps
    const steps = test.apiCalls ? test.apiCalls.map((call: any) => ({
      name: call.name || `${call.request?.method} ${call.request?.uri}`,
      status: call.status === 'passed' ? 'passed' as const : 'failed' as const,
      start: call.startTime,
      stop: call.endTime,
      duration: call.duration,
      steps: this.convertApiCallToSubSteps(call),
    })) : [];

    return {
      uuid,
      tool: 'rest-assured',
      name: test.methodName || test.testName,
      fullName: test.testName,
      status,
      statusDetails: test.error ? {
        message: test.error.message || '',
        trace: test.error.stackTrace || '',
      } : undefined,
      stage: 'finished',
      start: test.startTime,
      stop: test.endTime,
      duration,
      steps,
      attachments: [],
      extra: {
        restAssured: {
          retries: test.retryCount || 0,
        },
        parameters: test.parameters ? Object.entries(test.parameters).map(([name, value]) => ({
          name,
          value: String(value)
        })) : undefined,
        testClass: test.testName.split('.').slice(0, -1).join('.'),
        testMethod: test.methodName,
        flakyReason: test.flakyReason,
      },
    };
  }

  /**
   * Convert API call details into sub-steps for detailed view
   * Creates parent-child hierarchy: API Call > Request/Response > Individual fields
   */
  private convertApiCallToSubSteps(call: any): any[] {
    const subSteps = [];

    // Request step with nested sub-steps for each field
    if (call.request) {
      const requestSubSteps = [];

      // Method & URL
      if (call.request.method && call.request.uri) {
        requestSubSteps.push({
          name: `Method: ${call.request.method} | URL: ${call.request.uri}`,
          status: 'passed',
          start: call.startTime,
          stop: call.startTime,
          duration: 0,
        });
      }

      // Headers
      if (call.request.headers) {
        requestSubSteps.push({
          name: `Headers`,
          status: 'passed',
          start: call.startTime,
          stop: call.startTime,
          duration: 0,
          statusDetails: { message: call.request.headers },
        });
      }

      // Body
      if (call.request.body) {
        requestSubSteps.push({
          name: `Body`,
          status: 'passed',
          start: call.startTime,
          stop: call.startTime,
          duration: 0,
          statusDetails: { message: call.request.body },
        });
      }

      subSteps.push({
        name: `📤 Request`,
        status: 'passed',
        start: call.startTime,
        stop: call.startTime + 1,
        duration: 1,
        steps: requestSubSteps,
      });
    }

    // Response step with nested sub-steps for each field
    if (call.response) {
      const responseSubSteps = [];

      // Status & Response Time
      const statusLine = call.response.statusLine || '';
      responseSubSteps.push({
        name: `Status: ${call.response.statusCode}${statusLine ? ' ' + statusLine : ''} | Response Time: ${call.response.responseTime}`,
        status: call.status === 'passed' ? 'passed' : 'failed',
        start: call.endTime - 1,
        stop: call.endTime,
        duration: 0,
      });

      // Headers
      if (call.response.headers) {
        responseSubSteps.push({
          name: `Headers`,
          status: call.status === 'passed' ? 'passed' : 'failed',
          start: call.endTime - 1,
          stop: call.endTime,
          duration: 0,
          statusDetails: { message: call.response.headers },
        });
      }

      // Body
      if (call.response.body) {
        responseSubSteps.push({
          name: `Body`,
          status: call.status === 'passed' ? 'passed' : 'failed',
          start: call.endTime - 1,
          stop: call.endTime,
          duration: 0,
          statusDetails: { message: call.response.body },
        });
      }

      subSteps.push({
        name: `📥 Response`,
        status: call.status === 'passed' ? 'passed' : 'failed',
        start: call.endTime - 1,
        stop: call.endTime,
        duration: 1,
        steps: responseSubSteps,
      });
    }

    return subSteps;
  }
}
