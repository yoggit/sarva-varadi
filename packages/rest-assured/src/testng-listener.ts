import { BaseAdapter, SarvaTestResult } from '@sarva-varadi/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * RestAssured adapter for capturing API test results
 * This adapter extends BaseAdapter to convert RestAssured/TestNG test results
 * into Sarva-Varadi format with REST API specific details
 */
export class RestAssuredAdapter extends BaseAdapter {
  /**
   * Adapt a TestNG test result to Sarva-Varadi format
   * @param testName - Full test name including class
   * @param methodName - Test method name
   * @param status - Test status (PASS, FAIL, SKIP)
   * @param startTime - Test start timestamp
   * @param endTime - Test end timestamp
   * @param error - Error details if test failed
   * @param parameters - Test parameters (for data-driven tests)
   */
  adaptTest(
    testName: string,
    methodName: string,
    status: string,
    startTime: number,
    endTime: number,
    error?: any,
    parameters?: Record<string, any>
  ): SarvaTestResult {
    const uuid = this.generateUUID();
    const duration = endTime - startTime;

    // Map TestNG status to Sarva-Varadi status
    let sarvaStatus: 'passed' | 'failed' | 'skipped' | 'broken';
    if (status === 'PASS') {
      sarvaStatus = 'passed';
    } else if (status === 'FAIL') {
      sarvaStatus = error?.message?.includes('AssertionError') ? 'failed' : 'broken';
    } else if (status === 'SKIP') {
      sarvaStatus = 'skipped';
    } else {
      sarvaStatus = 'broken';
    }

    return {
      uuid,
      tool: 'rest-assured',
      name: methodName,
      fullName: testName,
      status: sarvaStatus,
      statusDetails: error ? {
        message: error.message || '',
        trace: error.stackTrace || '',
      } : undefined,
      stage: 'finished',
      start: startTime,
      stop: endTime,
      duration,
      steps: [],
      attachments: [],
      extra: {
        restAssured: {
          // REST API details will be added when captureApiDetails is called
        },
        parameters: parameters ? Object.entries(parameters).map(([name, value]) => ({
          name,
          value: String(value)
        })) : undefined,
        testClass: testName.split('.').slice(0, -1).join('.'),
        testMethod: methodName,
      },
    };
  }

  /**
   * Parse REST API request/response details from test context
   * This can be called from tests to attach API details
   */
  captureApiDetails(
    method: string,
    url: string,
    statusCode: number,
    requestBody?: string,
    responseBody?: string,
    headers?: Record<string, string>
  ): void {
    // Store API details that can be attached to the current test
    const apiDetails = {
      method,
      url,
      statusCode,
      requestBody,
      responseBody,
      headers,
    };

    // Write to a temp file that the listener can pick up
    const tempDir = path.join(process.cwd(), '.sarva-temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const detailsFile = path.join(tempDir, `api-${Date.now()}.json`);
    fs.writeFileSync(detailsFile, JSON.stringify(apiDetails, null, 2));
  }
}

/**
 * TestNG listener implementation (Java code template)
 * Save this as SarvaVaradiListener.java in your Java project
 *
 * import org.testng.*;
 * import com.google.gson.Gson;
 * import java.io.*;
 * import java.util.*;
 *
 * public class SarvaVaradiListener implements ITestListener {
 *     private List<Map<String, Object>> results = new ArrayList<>();
 *     private Gson gson = new Gson();
 *
 *     @Override
 *     public void onTestStart(ITestResult result) {
 *         // Test started
 *     }
 *
 *     @Override
 *     public void onTestSuccess(ITestResult result) {
 *         captureResult(result, "PASS");
 *     }
 *
 *     @Override
 *     public void onTestFailure(ITestResult result) {
 *         captureResult(result, "FAIL");
 *     }
 *
 *     @Override
 *     public void onTestSkipped(ITestResult result) {
 *         captureResult(result, "SKIP");
 *     }
 *
 *     private void captureResult(ITestResult result, String status) {
 *         Map<String, Object> testData = new HashMap<>();
 *         testData.put("testName", result.getTestClass().getName() + "." + result.getMethod().getMethodName());
 *         testData.put("methodName", result.getMethod().getMethodName());
 *         testData.put("status", status);
 *         testData.put("startTime", result.getStartMillis());
 *         testData.put("endTime", result.getEndMillis());
 *
 *         if (result.getThrowable() != null) {
 *             Map<String, String> error = new HashMap<>();
 *             error.put("message", result.getThrowable().getMessage());
 *             error.put("stackTrace", getStackTrace(result.getThrowable()));
 *             testData.put("error", error);
 *         }
 *
 *         results.add(testData);
 *     }
 *
 *     @Override
 *     public void onFinish(ITestContext context) {
 *         try {
 *             File outputDir = new File("sarva-results");
 *             outputDir.mkdirs();
 *
 *             File outputFile = new File(outputDir, "test-results.json");
 *             FileWriter writer = new FileWriter(outputFile);
 *             writer.write(gson.toJson(results));
 *             writer.close();
 *
 *             System.out.println("Sarva-Varadi results saved to: " + outputFile.getAbsolutePath());
 *         } catch (IOException e) {
 *             e.printStackTrace();
 *         }
 *     }
 *
 *     private String getStackTrace(Throwable throwable) {
 *         StringWriter sw = new StringWriter();
 *         PrintWriter pw = new PrintWriter(sw);
 *         throwable.printStackTrace(pw);
 *         return sw.toString();
 *     }
 * }
 */
