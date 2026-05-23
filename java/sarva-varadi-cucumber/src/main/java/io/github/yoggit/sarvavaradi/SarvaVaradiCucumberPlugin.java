package io.github.yoggit.sarvavaradi;

import com.google.gson.GsonBuilder;
import io.cucumber.plugin.EventListener;
import io.cucumber.plugin.event.*;

import java.io.*;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

/**
 * Sarva-Varadi Cucumber plugin.
 *
 * Captures Feature → Scenario → Step execution and writes
 * sarva-varadi-results/test-results.json in Sarva-Varadi native format.
 *
 * Register in cucumber.properties or @CucumberOptions:
 *   cucumber.plugin=io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin
 *
 * Then generate the HTML report:
 *   npx @sarva-varadi/core generate \
 *     --input sarva-varadi-results/test-results.json \
 *     --output sarva-report
 */
public class SarvaVaradiCucumberPlugin implements EventListener {

    private static final String OUTPUT_FILE = "test-results.json";
    private final String outputDir;

    private final List<Map<String, Object>> results = Collections.synchronizedList(new ArrayList<>());
    private final Map<String, ScenarioState> activeScenarios = Collections.synchronizedMap(new LinkedHashMap<>());

    public SarvaVaradiCucumberPlugin() {
        this.outputDir = SarvaVaradiConfig.getOutputDir();
    }

    // -------------------------------------------------------------------------
    // EventListener
    // -------------------------------------------------------------------------

    @Override
    public void setEventPublisher(EventPublisher publisher) {
        publisher.registerHandlerFor(TestRunStarted.class,   this::onTestRunStarted);
        publisher.registerHandlerFor(TestCaseStarted.class,  this::onTestCaseStarted);
        publisher.registerHandlerFor(TestStepStarted.class,  this::onTestStepStarted);
        publisher.registerHandlerFor(TestStepFinished.class, this::onTestStepFinished);
        publisher.registerHandlerFor(TestCaseFinished.class, this::onTestCaseFinished);
        publisher.registerHandlerFor(TestRunFinished.class,  this::onTestRunFinished);
    }

    // -------------------------------------------------------------------------
    // Event handlers
    // -------------------------------------------------------------------------

    private void onTestRunStarted(TestRunStarted event) {
        try {
            Files.createDirectories(Paths.get(outputDir));
        } catch (IOException e) {
            System.err.println("Sarva-Varadi: Failed to create output dir: " + e.getMessage());
        }
        System.out.println("\n🎯 Sarva-Varadi: Starting Cucumber test run");
    }

    private void onTestCaseStarted(TestCaseStarted event) {
        TestCase tc = event.getTestCase();
        String id = tc.getId().toString();

        ScenarioState state = new ScenarioState();
        state.uri          = tc.getUri().toString();
        state.featureName  = deriveFeatureName(state.uri);
        state.scenarioName = tc.getName();
        state.tags         = new ArrayList<>(tc.getTags());
        state.startMs      = event.getInstant().toEpochMilli();

        activeScenarios.put(id, state);
    }

    private void onTestStepStarted(TestStepStarted event) {
        String id = event.getTestCase().getId().toString();
        ScenarioState state = activeScenarios.get(id);
        if (state == null) return;

        if (!(event.getTestStep() instanceof PickleStepTestStep)) return; // skip hooks

        // Reset the WebDriver action collector so we capture only this step's actions
        toolActionBusClear();

        PickleStepTestStep pStep = (PickleStepTestStep) event.getTestStep();
        StepState step = new StepState();
        step.keyword = pStep.getStep().getKeyword().trim();
        step.text    = pStep.getStep().getText();
        step.name    = step.keyword + " " + step.text;
        step.startMs = event.getInstant().toEpochMilli();
        state.pendingStep = step;
    }

    private void onTestStepFinished(TestStepFinished event) {
        String id = event.getTestCase().getId().toString();
        ScenarioState state = activeScenarios.get(id);
        if (state == null || state.pendingStep == null) return;

        StepState step   = state.pendingStep;
        step.endMs       = event.getInstant().toEpochMilli();
        step.duration    = step.endMs - step.startMs;
        step.status      = mapStatus(event.getResult().getStatus());

        Throwable err = event.getResult().getError();
        if (err != null) {
            step.errorMessage = err.getMessage() != null ? err.getMessage() : err.getClass().getName();
        }

        // Collect WebDriver / tool actions captured during this step as sub-steps
        step.subSteps = toolActionsToSubSteps(toolActionDrain());

        state.steps.add(step);
        state.pendingStep = null;
    }

    private void onTestCaseFinished(TestCaseFinished event) {
        TestCase tc = event.getTestCase();
        String id = tc.getId().toString();
        ScenarioState state = activeScenarios.remove(id);
        if (state == null) return;

        state.endMs    = event.getInstant().toEpochMilli();
        state.duration = state.endMs - state.startMs;
        state.status   = mapStatus(event.getResult().getStatus());

        Throwable err = event.getResult().getError();
        if (err != null) {
            state.errorMessage = err.getMessage() != null ? err.getMessage() : err.getClass().getName();
            state.errorTrace   = stackTrace(err);
        }

        results.add(toSarvaResult(state));
    }

    private void onTestRunFinished(TestRunFinished event) {
        writeJson();
        System.out.println("\n✅ Sarva-Varadi: Results saved to " + outputDir + "/" + OUTPUT_FILE);
        System.out.println("📊 Total scenarios: " + results.size());
        printSummary();
    }

    // -------------------------------------------------------------------------
    // Serialisation — writes Sarva-Varadi native JSON directly
    // -------------------------------------------------------------------------

    private Map<String, Object> toSarvaResult(ScenarioState s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("uuid",     UUID.randomUUID().toString());
        m.put("tool",     "cucumber");
        m.put("name",     s.scenarioName);
        m.put("fullName", s.featureName + " > " + s.scenarioName);
        m.put("status",   s.status);

        if (s.errorMessage != null) {
            Map<String, String> det = new LinkedHashMap<>();
            det.put("message", s.errorMessage);
            if (s.errorTrace != null) det.put("trace", s.errorTrace);
            m.put("statusDetails", det);
        }

        m.put("stage",    "finished");
        m.put("start",    s.startMs);
        m.put("stop",     s.endMs);
        m.put("duration", s.duration);

        // Steps → Sarva-Varadi TestStep format
        List<Map<String, Object>> stepList = new ArrayList<>();
        for (StepState st : s.steps) {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("name",     st.name);
            sm.put("status",   st.status);
            sm.put("start",    st.startMs);
            sm.put("stop",     st.endMs);
            sm.put("duration", st.duration);
            if (st.errorMessage != null) {
                Map<String, String> sdet = new LinkedHashMap<>();
                sdet.put("message", st.errorMessage);
                sm.put("statusDetails", sdet);
            }
            if (!st.subSteps.isEmpty()) {
                sm.put("steps", st.subSteps);
            }
            stepList.add(sm);
        }
        m.put("steps",       stepList);
        m.put("attachments", new ArrayList<>());

        // Tags → labels
        if (!s.tags.isEmpty()) {
            List<Map<String, String>> labels = new ArrayList<>();
            for (String tag : s.tags) {
                Map<String, String> lbl = new LinkedHashMap<>();
                lbl.put("name",  "tag");
                lbl.put("value", tag.startsWith("@") ? tag.substring(1) : tag);
                labels.add(lbl);
            }
            m.put("labels", labels);
        }

        // extra.cucumber
        Map<String, Object> extra = new LinkedHashMap<>();
        Map<String, Object> cukExtra = new LinkedHashMap<>();
        cukExtra.put("featureName", s.featureName);
        cukExtra.put("featureUri",  s.uri);
        cukExtra.put("tags",        s.tags);
        extra.put("cucumber",   cukExtra);
        extra.put("testClass",  s.featureName);
        extra.put("testMethod", s.scenarioName);
        m.put("extra", extra);

        return m;
    }

    private void writeJson() {
        try {
            Files.createDirectories(Paths.get(outputDir));
            File out = new File(outputDir, OUTPUT_FILE);
            try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(out), StandardCharsets.UTF_8)) {
                writer.write(new GsonBuilder().setPrettyPrinting().create().toJson(results));
            }
        } catch (IOException e) {
            System.err.println("Sarva-Varadi: Failed to write results: " + e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String mapStatus(Status status) {
        switch (status) {
            case PASSED:    return "passed";
            case FAILED:    return "failed";
            case SKIPPED:   return "skipped";
            case PENDING:   return "skipped";
            case UNDEFINED: return "broken";
            case AMBIGUOUS: return "broken";
            default:        return "broken";
        }
    }

    private String deriveFeatureName(String uri) {
        // "classpath:features/user_authentication.feature" → "User Authentication"
        String fileName = uri.replaceAll(".*[/\\\\]", "").replaceAll("\\.feature$", "");
        String spaced   = fileName.replace("-", " ").replace("_", " ");
        StringBuilder sb = new StringBuilder();
        for (String word : spaced.split(" ")) {
            if (!word.isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
            }
        }
        return sb.length() > 0 ? sb.toString() : "Feature";
    }

    private String stackTrace(Throwable t) {
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        String s = sw.toString();
        return s.length() > 2000 ? s.substring(0, 2000) + "..." : s;
    }

    private void printSummary() {
        long passed  = results.stream().filter(r -> "passed".equals(r.get("status"))).count();
        long failed  = results.stream().filter(r -> "failed".equals(r.get("status"))).count();
        long skipped = results.stream().filter(r -> "skipped".equals(r.get("status"))).count();
        long broken  = results.stream().filter(r -> "broken".equals(r.get("status"))).count();
        System.out.println("📈 Summary: " + passed + " passed, " + failed + " failed, " +
                           skipped + " skipped, " + broken + " broken");
    }

    // -------------------------------------------------------------------------
    // State containers
    // -------------------------------------------------------------------------

    private static class ScenarioState {
        String uri;
        String featureName;
        String scenarioName;
        List<String> tags     = new ArrayList<>();
        long   startMs;
        long   endMs;
        long   duration;
        String status;
        String errorMessage;
        String errorTrace;
        List<StepState> steps = new ArrayList<>();
        StepState pendingStep;
    }

    private static class StepState {
        String keyword;
        String text;
        String name;
        long   startMs;
        long   endMs;
        long   duration;
        String status;
        String errorMessage;
        List<Map<String, Object>> subSteps = Collections.emptyList();
    }

    // -------------------------------------------------------------------------
    // Optional tool-action bus (reflection-based, no compile-time dependency)
    // Works when sarva-varadi-selenium (or any compatible listener) is on the
    // classpath; degrades gracefully when it isn't.
    // -------------------------------------------------------------------------

    private Object tryGetWebDriverListener() {
        try {
            Class<?> ctxClass = Class.forName("io.github.yoggit.sarvavaradi.SarvaVaradiContext");
            Method m = ctxClass.getDeclaredMethod("getListener");
            return m.invoke(null);
        } catch (Exception e) {
            return null;
        }
    }

    private void toolActionBusClear() {
        Object listener = tryGetWebDriverListener();
        if (listener == null) return;
        try {
            listener.getClass().getMethod("clearActions").invoke(listener);
        } catch (Exception ignored) {}
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> toolActionDrain() {
        Object listener = tryGetWebDriverListener();
        if (listener == null) return Collections.emptyList();
        try {
            List<Map<String, Object>> actions = (List<Map<String, Object>>)
                listener.getClass().getMethod("getActions").invoke(listener);
            listener.getClass().getMethod("clearActions").invoke(listener);
            return actions != null ? actions : Collections.emptyList();
        } catch (Exception ignored) {}
        return Collections.emptyList();
    }

    private List<Map<String, Object>> toolActionsToSubSteps(List<Map<String, Object>> actions) {
        if (actions.isEmpty()) return Collections.emptyList();
        List<Map<String, Object>> subSteps = new ArrayList<>();
        for (int i = 0; i < actions.size(); i++) {
            Map<String, Object> action = actions.get(i);
            String type   = (String) action.getOrDefault("type", "");
            String desc   = (String) action.getOrDefault("description", "");
            String status = (String) action.get("status");
            long   ts     = toLong(action.get("timestamp"));

            if ("success".equals(status)) continue; // skip after-completion markers
            if ("screenshot".equals(type)) continue;

            // Estimate end time from next action's timestamp
            long endTs = ts + 100;
            for (int j = i + 1; j < actions.size(); j++) {
                long next = toLong(actions.get(j).get("timestamp"));
                if (next > 0) { endTs = next; break; }
            }

            Map<String, Object> sub = new LinkedHashMap<>();
            sub.put("name",     formatActionName(type, desc));
            sub.put("status",   "error".equals(type) ? "failed" : "passed");
            sub.put("start",    ts);
            sub.put("stop",     endTs);
            sub.put("duration", endTs - ts);
            if ("error".equals(type)) {
                Map<String, String> det = new LinkedHashMap<>();
                det.put("message", desc.replace("Error: ", ""));
                sub.put("statusDetails", det);
            }
            subSteps.add(sub);
        }
        return subSteps;
    }

    private String formatActionName(String type, String desc) {
        switch (type) {
            case "navigate":    return "Navigate: "  + desc.replace("GET ", "");
            case "click":       return "Click: "     + desc.replace("Click on ", "");
            case "sendKeys":    return "Type: "      + desc.replace("Type into ", "");
            case "findElement": return "Find: "      + desc.replace("Find: ", "");
            case "error":       return "Error: "     + desc.replace("Error: ", "");
            default: return desc.isEmpty() ? type : desc;
        }
    }

    private long toLong(Object val) {
        if (val instanceof Number) return ((Number) val).longValue();
        return 0L;
    }
}
