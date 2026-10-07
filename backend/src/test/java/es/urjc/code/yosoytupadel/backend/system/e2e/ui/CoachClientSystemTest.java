package es.urjc.code.yosoytupadel.backend.system.e2e.ui;

import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;


import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@TestPropertySource(properties = "server.port=8443")
class CoachClientSystemTest extends ClientSystemTestSupport {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private BookingRepository bookingRepository;

    @BeforeEach
    void setUpData() {
        bookingRepository.deleteAll();
        userRepository.deleteAll();
        User player = new User(
                "player@example.com",
                passwordEncoder.encode("password"),
                UserRole.USER,
                "Test Player"
        );
        userRepository.save(player);

        User coach = new User(
                "coach@example.com",
                passwordEncoder.encode("coach-password"),
                UserRole.COACH,
                "Coach Fernando"
        );
        coach.setSkillLevel(4.5);
        coach.setSessionPrice(25.0);
        userRepository.save(coach);
        openBrowser();
    }

    @Test
    void shouldDisplayCoachCatalogueAndAllowTimeSlotSelection() {
        openPath("/coaches");
        waitForText("Coach Fernando");

        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("Nuestros Entrenadores")
                .contains("FEP Nivel");

        login("player@example.com", "password");

        openPath("/coaches");
        waitForText("Coach Fernando");

        clickAndWaitForPath(By.cssSelector("a[href^='/coaches/']"), "/coaches/");
        waitForText("Coach Fernando");

        String tomorrowStr = java.time.LocalDate.now().plusDays(1)
                .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM", new java.util.Locale("es", "ES")))
                .replace(".", "");

        org.openqa.selenium.WebElement tomorrowTab = wait.until(
                org.openqa.selenium.support.ui.ExpectedConditions.elementToBeClickable(
                        By.xpath("//*[contains(text(), '" + tomorrowStr + "')]")
                )
        );
        tomorrowTab.click();

        try { Thread.sleep(500); } catch (Exception e) {}

        By availableSlot = By.xpath("//*[contains(text(), '09:00')]");
        org.openqa.selenium.WebElement slot = wait.until(
                org.openqa.selenium.support.ui.ExpectedConditions.presenceOfElementLocated(availableSlot)
        );

        ((org.openqa.selenium.JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", slot
        );

        wait.until(org.openqa.selenium.support.ui.ExpectedConditions.textToBePresentInElementLocated(
                By.tagName("body"), "RESERVAR SESIÓN"
        ));

        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("RESERVAR SESIÓN");
    }
}
