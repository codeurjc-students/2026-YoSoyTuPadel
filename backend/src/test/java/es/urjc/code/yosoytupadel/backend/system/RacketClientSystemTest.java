package es.urjc.code.yosoytupadel.backend.system;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, properties = {
        "spring.profiles.active=test",
        "server.port=8080"
})
public class RacketClientSystemTest extends BaseIntegrationTest {


    @Autowired
    private RacketRepository racketRepository;

    private WebDriver driver;

    @BeforeAll
    static void setupClass() {
        WebDriverManager.chromedriver().setup();
    }

    @BeforeEach
    void setUp() {
        racketRepository.deleteAll();
        racketRepository.save(new Racket(null, "Babolat", "Pure Aero", "Buen control", 13.5));

        ChromeOptions options = new ChromeOptions();
        //options.addArguments("--headless");
        driver = new ChromeDriver(options);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void shouldDisplayRacketListOnHomePage() {

        driver.get("http://localhost:5173");


        WebElement body = driver.findElement(By.tagName("body"));

        assertThat(body.getText()).contains("Babolat");
        assertThat(body.getText()).contains("Pure Aero");
    }
}
