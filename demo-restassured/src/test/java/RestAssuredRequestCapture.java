import io.restassured.filter.Filter;
import io.restassured.filter.FilterContext;
import io.restassured.response.Response;
import io.restassured.specification.FilterableRequestSpecification;
import io.restassured.specification.FilterableResponseSpecification;
import com.google.gson.Gson;
import java.io.*;
import java.util.*;

/**
 * RestAssured filter to capture request/response details for Sarva-Varadi reporting
 */
public class RestAssuredRequestCapture implements Filter {
    private static final ThreadLocal<List<Map<String, Object>>> apiCalls = ThreadLocal.withInitial(ArrayList::new);
    private static final Gson gson = new Gson();

    // Masking is OFF by default - set system property to enable
    // -Dsarva.maskSensitiveData=true
    private static final boolean MASK_SENSITIVE_DATA =
        Boolean.parseBoolean(System.getProperty("sarva.maskSensitiveData", "false"));

    @Override
    public Response filter(FilterableRequestSpecification requestSpec,
                          FilterableResponseSpecification responseSpec,
                          FilterContext ctx) {
        long startTime = System.currentTimeMillis();

        // Capture request details
        Map<String, Object> requestDetails = new HashMap<>();
        requestDetails.put("method", requestSpec.getMethod());
        String headers = requestSpec.getHeaders().asList().toString();
        requestDetails.put("headers", MASK_SENSITIVE_DATA ? maskSensitiveHeaders(headers) : headers);

        if (requestSpec.getBody() != null) {
            String body = requestSpec.getBody().toString();
            requestDetails.put("body", MASK_SENSITIVE_DATA ? maskSensitiveData(body) : body);
        }

        // Execute the request
        Response response = ctx.next(requestSpec, responseSpec);

        long endTime = System.currentTimeMillis();

        // Capture response details
        Map<String, Object> responseDetails = new HashMap<>();
        responseDetails.put("statusCode", response.getStatusCode());
        responseDetails.put("statusLine", response.getStatusLine());
        responseDetails.put("responseTime", response.getTime() + "ms");
        String responseHeaders = response.getHeaders().asList().toString();
        responseDetails.put("headers", MASK_SENSITIVE_DATA ? maskSensitiveHeaders(responseHeaders) : responseHeaders);

        try {
            String responseBody = response.getBody().asString();
            if (responseBody != null && !responseBody.isEmpty()) {
                // Limit response body size to avoid huge logs
                if (responseBody.length() > 1000) {
                    responseBody = responseBody.substring(0, 1000) + "... (truncated)";
                }
                responseDetails.put("body", responseBody);
            }
        } catch (Exception e) {
            responseDetails.put("body", "<unable to capture response body>");
        }

        // Combine into API call record
        Map<String, Object> apiCall = new HashMap<>();
        apiCall.put("name", requestSpec.getMethod() + " " + requestSpec.getURI());
        apiCall.put("request", requestDetails);
        apiCall.put("response", responseDetails);
        apiCall.put("startTime", startTime);
        apiCall.put("endTime", endTime);
        apiCall.put("duration", endTime - startTime);
        apiCall.put("status", response.getStatusCode() >= 200 && response.getStatusCode() < 300 ? "passed" : "failed");

        apiCalls.get().add(apiCall);

        return response;
    }

    /**
     * Get captured API calls for current thread
     */
    public static List<Map<String, Object>> getApiCalls() {
        return new ArrayList<>(apiCalls.get());
    }

    /**
     * Clear API calls for current thread
     */
    public static void clearApiCalls() {
        apiCalls.get().clear();
    }

    /**
     * Mask sensitive data in request/response bodies
     */
    private static String maskSensitiveData(String data) {
        if (data == null) return null;

        // Mask common sensitive fields (case-insensitive)
        String masked = data;
        String[] sensitiveFields = {"password", "token", "apikey", "api_key", "secret", "authorization",
                                    "credit_card", "creditcard", "ssn", "social_security"};

        for (String field : sensitiveFields) {
            // Match patterns like: "password":"value" or "password": "value"
            masked = masked.replaceAll("(?i)(\"" + field + "\"\\s*:\\s*\")([^\"]+)(\")", "$1***MASKED***$3");
            // Match patterns like: password=value
            masked = masked.replaceAll("(?i)(" + field + "\\s*=\\s*)([^&\\s]+)", "$1***MASKED***");
        }

        return masked;
    }

    /**
     * Mask sensitive headers
     */
    private static String maskSensitiveHeaders(String headers) {
        if (headers == null) return null;

        String masked = headers;
        String[] sensitiveHeaders = {"Authorization", "X-API-Key", "X-Auth-Token", "Cookie", "Set-Cookie"};

        for (String header : sensitiveHeaders) {
            // Match patterns like: Authorization: Bearer token or Authorization=Bearer token
            masked = masked.replaceAll("(?i)(" + header + "[:=]\\s*)([^,\\]\\n]+)", "$1***MASKED***");
        }

        return masked;
    }

    /**
     * Save API calls to file for the test
     */
    public static void saveApiCalls(String testName) {
        List<Map<String, Object>> calls = getApiCalls();
        if (calls.isEmpty()) {
            return;
        }

        try {
            File outputDir = new File("sarva-varadi-results/api-calls");
            outputDir.mkdirs();

            String safeTestName = testName.replaceAll("[^a-zA-Z0-9.-]", "_");
            File outputFile = new File(outputDir, safeTestName + ".json");

            FileWriter writer = new FileWriter(outputFile);
            writer.write(gson.toJson(calls));
            writer.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
