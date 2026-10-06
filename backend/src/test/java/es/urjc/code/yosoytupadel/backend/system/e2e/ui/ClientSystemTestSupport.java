package es.urjc.code.yosoytupadel.backend.system.e2e.ui;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

abstract class ClientSystemTestSupport extends BaseIntegrationTest {

    protected WebDriver driver;
    protected WebDriverWait wait;

    @BeforeAll
    static void configureChromeDriver() {
        WebDriverManager.chromedriver().setup();
    }

    @AfterEach
    void closeBrowser() {
        if (driver != null) {
            driver.quit();
        }
    }

    protected void openBrowser() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
        options.addArguments("--ignore-certificate-errors", "--window-size=1440,1200");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    protected String frontendUrl() {
        return System.getProperty("frontend.url", "http://localhost:5173");
    }

    protected void openPath(String path) {
        driver.get(frontendUrl() + path);
    }

    protected void waitForText(String text) {
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), text));
    }

    protected void login(String email, String password) {
        openPath("/login");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("auth-email")))
                .sendKeys(email);
        driver.findElement(By.id("auth-password")).sendKeys(password);
        WebElement submitButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("button[type='submit']")
        ));
        new Actions(driver).moveToElement(submitButton).click().perform();
        wait.until(ExpectedConditions.not(ExpectedConditions.urlContains("/login")));
    }

    protected void clickAndWaitForPath(By locator, String pathFragment) {
        WebElement element = wait.until(ExpectedConditions.elementToBeClickable(locator));

        String href = element.getAttribute("href");

        if (href != null && !href.isEmpty()) {
            driver.get(href);
        } else {
            element.click();
        }

        wait.until(ExpectedConditions.urlContains(pathFragment));
    }
}
