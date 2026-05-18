package io.github.yoggit.sarvavaradi;

import io.restassured.filter.Filter;
import io.restassured.filter.FilterContext;
import io.restassured.response.Response;
import io.restassured.specification.FilterableRequestSpecification;
import io.restassured.specification.FilterableResponseSpecification;
import com.google.gson.Gson;
import java.io.*;
import java.util.*;

/**
 * RestAssured filter that captures request/response details for Sarva-Varadi reporting.
 *
 * Add to test setup:
 *   RestAssured.filters(new RestAssuredRequestCapture());
 *
 * Sensitive data masking (off by default):
 *   mvn test -Dsarva.maskSensitiveData=true
 */
public class RestAssuredRequestCapture implements Filter {

    private static final ThreadLocal<List<Map<String, Object>>> apiCalls =
            ThreadLocal.withInitial(ArrayList::new);
    private static final Gson gson = new Gson();

    private static final boolean MASK_SENSITIVE_DATA = SarvaVaradiConfig.isMaskSensitiveData();

    @Override
    public Response filter(FilterableRequestSpecification requestSpec,
                           FilterableResponseSpecification responseSpec,
                           FilterContext ctx) {
        long startTime = System.currentTimeMillis();

        Map<String, Object> requestDetails = new HashMap<>();
        requestDetails.put("method", requestSpec.getMethod());
        requestDetails.put("uri", requestSpec.getURI());
        String reqHeaders = requestSpec.getHeaders().asList().toString();
        requestDetails.put("headers", MASK_SENSITIVE_DATA ? maskHeaders(reqHeaders) : reqHeaders);
        if (requestSpec.getBody() != null) {
            String body = requestSpec.getBody().toString();
            requestDetails.put("body", MASK_SENSITIVE_DATA ? maskBody(body) : body);
        }

        Response response = ctx.next(requestSpec, responseSpec);
        long endTime = System.currentTimeMillis();

        Map<String, Object> responseDetails = new HashMap<>();
        responseDetails.put("statusCode", response.getStatusCode());
        responseDetails.put("statusLine", response.getStatusLine());
        responseDetails.put("responseTime", response.getTime() + "ms");
        String resHeaders = response.getHeaders().asList().toString();
        responseDetails.put("headers", MASK_SENSITIVE_DATA ? maskHeaders(resHeaders) : resHeaders);
        try {
            String responseBody = response.getBody().asString();
            if (responseBody != null && !responseBody.isEmpty()) {
                if (responseBody.length() > 1000) {
                    responseBody = responseBody.substring(0, 1000) + "... (truncated)";
                }
                responseDetails.put("body", responseBody);
            }
        } catch (Exception e) {
            responseDetails.put("body", "<unable to capture response body>");
        }

        Map<String, Object> apiCall = new HashMap<>();
        apiCall.put("name", requestSpec.getMethod() + " " + requestSpec.getURI());
        apiCall.put("request", requestDetails);
        apiCall.put("response", responseDetails);
        apiCall.put("startTime", startTime);
        apiCall.put("endTime", endTime);
        apiCall.put("duration", endTime - startTime);
        apiCall.put("status", response.getStatusCode() >= 200 && response.getStatusCode() < 300
                ? "passed" : "failed");

        apiCalls.get().add(apiCall);
        return response;
    }

    public static List<Map<String, Object>> getApiCalls() {
        return new ArrayList<>(apiCalls.get());
    }

    public static void clearApiCalls() {
        apiCalls.get().clear();
    }

    public static void saveApiCalls(String testName) {
        List<Map<String, Object>> calls = getApiCalls();
        if (calls.isEmpty()) return;

        try {
            File outputDir = new File("sarva-varadi-results/api-calls");
            outputDir.mkdirs();
            String safeTestName = testName.replaceAll("[^a-zA-Z0-9.-]", "_");
            File outputFile = new File(outputDir, safeTestName + ".json");
            try (FileWriter writer = new FileWriter(outputFile)) {
                writer.write(gson.toJson(calls));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static String maskBody(String data) {
        if (data == null) return null;
        String masked = data;
        String[] fields = {"password", "token", "apikey", "api_key", "secret",
                           "authorization", "credit_card", "ssn"};
        for (String field : fields) {
            masked = masked.replaceAll("(?i)(\"" + field + "\"\\s*:\\s*\")([^\"]+)(\")", "$1***$3");
            masked = masked.replaceAll("(?i)(" + field + "\\s*=\\s*)([^&\\s]+)", "$1***");
        }
        return masked;
    }

    private static String maskHeaders(String headers) {
        if (headers == null) return null;
        String masked = headers;
        String[] sensitiveHeaders = {"Authorization", "X-API-Key", "X-Auth-Token", "Cookie"};
        for (String h : sensitiveHeaders) {
            masked = masked.replaceAll("(?i)(" + h + "[:=]\\s*)([^,\\]\\n]+)", "$1***");
        }
        return masked;
    }
}
