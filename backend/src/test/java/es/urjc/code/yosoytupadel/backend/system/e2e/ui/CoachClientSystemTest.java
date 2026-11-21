package es.urjc.code.yosoytupadel.backend.system.e2e.ui;

import es.urjc.code.yosoytupadel.backend.entities.Booking;
import es.urjc.code.yosoytupadel.backend.entities.BookingStatus;
import es.urjc.code.yosoytupadel.backend.entities.BookingType;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.time.LocalTime;

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

    private User player;
    private User coach;

    @BeforeEach
    void setUpData() {
        bookingRepository.deleteAll();
        userRepository.deleteAll();
        player = new User(
                "player@example.com",
                passwordEncoder.encode("password"),
                UserRole.USER,
                "Test Player"
        );
        player.setSkillLevel(2.0);
        player = userRepository.save(player);

        coach = new User(
                "coach@example.com",
                passwordEncoder.encode("coach-password"),
                UserRole.COACH,
                "Coach Fernando"
        );
        coach.setSkillLevel(4.5);
        coach.setSessionPrice(25.0);
        coach = userRepository.save(coach);
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

        String tomorrowStr = LocalDate.now().plusDays(1)
                .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM", java.util.Locale.of("es", "ES")))
                .replace(".", "");

        WebElement tomorrowTab = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//*[contains(text(), '" + tomorrowStr + "')]")
                )
        );
        tomorrowTab.click();

        By availableSlot = By.xpath("//*[contains(text(), '09:00')]");
        WebElement slot = wait.until(
                ExpectedConditions.refreshed(ExpectedConditions.elementToBeClickable(availableSlot))
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

    @Test
    void shouldAllowCoachToEvaluateCompletedTrainingSessionAndUpdateStudentLevel() {
        Booking completedTraining = new Booking();
        completedTraining.setUser(player);
        completedTraining.setCoach(coach);
        completedTraining.setBookingDate(LocalDate.now().minusDays(2));
        completedTraining.setStartTime(LocalTime.of(10, 0));
        completedTraining.setEndTime(LocalTime.of(11, 0));
        completedTraining.setBookingPrice(25.0);
        completedTraining.setType(BookingType.TRAINING);
        completedTraining.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(completedTraining);

        login("coach@example.com", "coach-password");

        WebElement dashboardButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//*[contains(text(), 'Panel de entrenador')]"))
        );
        dashboardButton.click();

        waitForText("PANEL DE ENTRENADOR");
        waitForText("Test Player - Nivel 2.00");

        WebElement evaluateButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(text(), 'CALIFICAR ALUMNO')]"))
        );
        evaluateButton.click();

        waitForText("Calificar a Test Player");

        WebElement scoreEightButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//div[@role='dialog']//button[normalize-space()='8']"))
        );
        scoreEightButton.click();
        waitForText("Nivel por encima del actual");

        WebElement confirmButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//div[@role='dialog']//button[contains(text(), 'Confirmar calificación')]"))
        );
        confirmButton.click();

        waitForText("CALIFICADO (8/10)");
        waitForText("Test Player - Nivel 2.15");

        User updatedPlayer = userRepository.findById(player.getId()).orElseThrow();
        assertThat(updatedPlayer.getSkillLevel()).isEqualTo(2.15);
    }
}