import { SarvaTestResult } from '../types';
import { detectFormat, isSarvaVaradiFormat, SupportedFormat } from './format-detector';
import { JUnitConverter } from './junit-converter';
import { TestNGConverter } from './testng-converter';
import { TestNGListenerConverter } from './testng-listener-converter';
import { TestNGSeleniumConverter } from './testng-selenium-converter';
import { CucumberConverter } from './cucumber-converter';

export * from './format-detector';
export * from './base-converter';
export * from './junit-converter';
export * from './testng-converter';
export * from './testng-listener-converter';
export * from './testng-selenium-converter';
export * from './cucumber-converter';

/**
 * Smart converter that auto-detects format and converts to Sarva-Varadi format
 * Only converts if data is NOT already in Sarva-Varadi format
 */
export class SmartConverter {
  /**
   * Convert test results to Sarva-Varadi format (auto-detects format)
   * @param data Test results in any supported format
   * @returns Converted results in Sarva-Varadi format
   */
  static convert(data: any): SarvaTestResult[] {
    // Check if already in Sarva-Varadi format
    if (isSarvaVaradiFormat(data)) {
      console.log('✓ Data is already in Sarva-Varadi format, skipping conversion');
      return data as SarvaTestResult[];
    }

    // Auto-detect format
    const format = detectFormat(data);
    console.log(`Detected format: ${format}`);

    if (format === 'unknown') {
      throw new Error('Unable to detect test results format. Supported formats: Sarva-Varadi, JUnit, TestNG, Cucumber');
    }

    // Convert based on detected format
    return this.convertFromFormat(data, format);
  }

  /**
   * Convert from a specific format
   */
  static convertFromFormat(data: any, format: SupportedFormat): SarvaTestResult[] {
    switch (format) {
      case 'sarva-varadi':
        return data as SarvaTestResult[];

      case 'junit':
        console.log('Converting from JUnit format...');
        return new JUnitConverter().convert(data);

      case 'testng':
        console.log('Converting from TestNG format...');
        return new TestNGConverter().convert(data);

      case 'testng-listener':
        console.log('Converting from TestNG Listener format...');
        return new TestNGListenerConverter().convert(data);

      case 'testng-selenium':
        console.log('Converting from TestNG Selenium format...');
        return new TestNGSeleniumConverter().convert(data);

      case 'cucumber':
        console.log('Converting from Cucumber format...');
        return new CucumberConverter().convert(data);

      case 'mocha':
      case 'jest':
        throw new Error(`${format} format support coming soon`);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
