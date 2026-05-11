# @sarva-varadi/selenium

Selenium WebDriver adapter for Sarva-Varadi test reporter.

## 🚧 Coming Soon

The Selenium adapter is currently under development. This package will provide integration with:

- Selenium WebDriver (Java)
- TestNG
- JUnit 5
- Cucumber (Java)

## Planned Features

- Capture browser logs
- Screenshot on test failure
- Video recording support
- Browser and platform information
- Driver version tracking
- Integration with Selenium Grid

## Installation (Once Available)

### Maven

```xml
<dependency>
    <groupId>io.github.yoggit</groupId>
    <artifactId>sarva-varadi-selenium</artifactId>
    <version>1.0.0</version>
    <scope>test</scope>
</dependency>
```

### Gradle

```gradle
testImplementation 'io.github.yoggit:sarva-varadi-selenium:1.0.0'
```

## Example Usage (Planned)

```java
import io.github.yoggit.sarvavaradi.SarvaListener;
import org.testng.annotations.Listeners;
import org.testng.annotations.Test;

@Listeners(SarvaListener.class)
public class MyTest {
    @Test
    public void testExample() {
        // Your test code
    }
}
```

## Configuration (Planned)

```java
SarvaConfig config = new SarvaConfig()
    .setOutputFolder("sarva-report")
    .setTitle("Selenium Tests")
    .enableHistory(true)
    .enableNotifications(true)
    .setSlackWebhook(System.getenv("SLACK_WEBHOOK_URL"));
```

## Contributing

Interested in helping build the Selenium adapter? Check out [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

Made with 📊 by [Sarva-Varadi](https://github.com/yoggit/sarva-varadi)
