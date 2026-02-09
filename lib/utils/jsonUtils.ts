/**
 * JSON Utility Functions
 * Safe JSON parsing with error handling
 */

/**
 * Safely parse a JSON string with fallback value
 * @param json - The JSON string to parse
 * @param fallback - The value to return if parsing fails
 * @returns Parsed JSON object or fallback value
 *
 * @example
 * const data = safeJSONParse<{ name: string }>('{"name":"test"}', {});
 * const empty = safeJSONParse('invalid', null); // returns null
 */
export function safeJSONParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) {
    return fallback;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    // Log the error but don't throw
    console.error('[JSON Parse Error] Failed to parse JSON:', {
      error: error instanceof Error ? error.message : String(error),
      jsonPreview: json?.substring(0, 100) + (json?.length > 100 ? '...' : ''),
    });
    return fallback;
  }
}

/**
 * Safely stringify an object to JSON with fallback value
 * @param obj - The object to stringify
 * @param fallback - The string to return if stringification fails
 * @returns JSON string or fallback value
 *
 * @example
 * const str = safeJSONStringify({ name: 'test' }, '{}');
 * const fallback = safeJSONStringify(circularObj, '{}'); // returns '{}'
 */
export function safeJSONStringify(obj: unknown, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('[JSON Stringify Error] Failed to stringify object:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}

/**
 * Parse a JSON array safely
 * @param json - The JSON string to parse
 * @returns Parsed array or empty array if parsing fails
 *
 * @example
 * const items = safeJSONParseArray('[1,2,3]'); // [1, 2, 3]
 * const empty = safeJSONParseArray('invalid'); // []
 */
export function safeJSONParseArray<T = unknown>(json: string | null | undefined): T[] {
  return safeJSONParse<T[]>(json, []);
}

/**
 * Parse a JSON object safely
 * @param json - The JSON string to parse
 * @returns Parsed object or empty object if parsing fails
 *
 * @example
 * const obj = safeJSONParseObject('{"key":"value"}'); // {key: 'value'}
 * const empty = safeJSONParseObject('invalid'); // {}
 */
export function safeJSONParseObject<T = Record<string, unknown>>(json: string | null | undefined): T {
  return safeJSONParse<T>(json, {} as T);
}
