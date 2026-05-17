package io.github.yoggit.sarvavaradi;

public class SarvaVaradiContext {

    private static final ThreadLocal<SarvaVaradiWebDriverListener> currentListener = new ThreadLocal<>();

    static void setListener(SarvaVaradiWebDriverListener listener) {
        currentListener.set(listener);
    }

    static SarvaVaradiWebDriverListener getListener() {
        return currentListener.get();
    }

    static void clearListener() {
        currentListener.remove();
    }
}
