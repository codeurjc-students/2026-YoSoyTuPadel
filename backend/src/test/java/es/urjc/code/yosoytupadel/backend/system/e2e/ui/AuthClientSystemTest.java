package es.urjc.code.yosoytupadel.backend.system.e2e.ui;

import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@TestPropertySource(properties = "server.port=8443")
class AuthClientSystemTest extends ClientSystemTestSupport {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUpData() {
        bookingRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.save(new User(
                "admin@example.com",
                passwordEncoder.encode("admin-password"),
                UserRole.ADMIN,
                "Admin User"
        ));
        openBrowser();
    }

    private void openRegistrationForm() {
        openPath("/login?mode=register");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("auth-email")));
        if (driver.findElements(By.id("auth-name")).isEmpty()) {
            driver.findElement(By.xpath("//button[contains(., 'Registrarse')]")).click();
        }
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("auth-name")));
    }

    @Test
    void shouldAuthenticateAnAdminAndRedirectToTheAdminPanel() {
        login("admin@example.com", "admin-password");

        openPath("/admin");

        wait.until(driver -> driver.getCurrentUrl().contains("admin"));

        assertThat(driver.getCurrentUrl()).contains("admin");
        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("PANEL DE ADMINISTRACIÓN");
    }

    @Test
    void shouldBlockRegistrationBeforeWizardWhenNicknameAlreadyExists() {
        User existingUser = new User();
        existingUser.setName("Existing User");
        existingUser.setNickname("victorcc02");
        existingUser.setEmail("existing@example.com");
        existingUser.setEncodedPassword(passwordEncoder.encode("Password123"));
        existingUser.setRole(UserRole.USER);
        userRepository.save(existingUser);

        openRegistrationForm();

        driver.findElement(By.id("auth-name")).sendKeys("Nuevo Usuario");
        driver.findElement(By.id("auth-nickname")).sendKeys("victorcc02");
        driver.findElement(By.id("auth-email")).sendKeys("nuevo@example.com");
        driver.findElement(By.id("auth-password")).sendKeys("Password123");
        driver.findElement(By.cssSelector("input[type='checkbox']")).click();
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        String alertText = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.cssSelector("[role='alert']"))
        ).getText();
        assertThat(alertText).containsAnyOf("El nombre de usuario ya está en uso.", "Conflict");
        assertThat(driver.findElements(By.cssSelector("[role='dialog']"))).isEmpty();
    }

    @Test
    void shouldRegisterFirstTimePlayerThroughLevelingWizard() {
        openRegistrationForm();

        driver.findElement(By.id("auth-name")).sendKeys("Carlos Debutante");
        driver.findElement(By.id("auth-nickname")).sendKeys("carlos_deb");
        driver.findElement(By.id("auth-email")).sendKeys("carlos.deb@example.com");
        driver.findElement(By.id("auth-password")).sendKeys("Password123");
        driver.findElement(By.cssSelector("input[type='checkbox']")).click();
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("[role='dialog']")));
        driver.findElement(By.xpath("//*[contains(text(), 'Sí, es mi primera vez')]")).click();
        driver.findElement(By.xpath("//button[contains(text(), 'FINALIZAR REGISTRO')]")).click();

        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("[role='dialog']")));

        User createdUser = userRepository.findByEmail("carlos.deb@example.com").orElseThrow();
        assertThat(createdUser.getSkillLevel()).isEqualTo(0.0);
        assertThat(driver.findElement(By.id("auth-email")).getAttribute("value"))
                .isEqualTo("carlos.deb@example.com");
    }

    @Test
    void shouldRegisterExperiencedPlayerThroughFiveQuestionWizard() {
        openRegistrationForm();

        driver.findElement(By.id("auth-name")).sendKeys("Laura Nivel");
        driver.findElement(By.id("auth-nickname")).sendKeys("laura_nivel");
        driver.findElement(By.id("auth-email")).sendKeys("laura.nivel@example.com");
        driver.findElement(By.id("auth-password")).sendKeys("Password123");
        driver.findElement(By.cssSelector("input[type='checkbox']")).click();
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("[role='dialog']")));
        driver.findElement(By.xpath("//*[contains(text(), 'No, ya he jugado antes')]")).click();
        driver.findElement(By.xpath("//button[contains(text(), 'CONTINUAR')]")).click();

        List<String> selectedAnswers = List.of(
                "Juego con regularidad (al menos 1 vez por semana) partidos amistosos.",
                "Controlo dirección, profundidad y globos defensivos con comodidad.",
                "Defiendo bien la pared de fondo y empiezo a resolver rebotes en pared lateral.",
                "Subo a la red en ocasiones, pero voleo sin control ni profundidad.",
                "Subo a la red tras el saque y mantengo la posición en paralelo con mi compañero."
        );

        for (int i = 0; i < selectedAnswers.size(); i++) {
            String answerText = selectedAnswers.get(i);
            wait.until(ExpectedConditions.visibilityOfElementLocated(
                    By.xpath("//*[contains(text(), '" + answerText + "')]")
            )).click();

            if (i < selectedAnswers.size() - 1) {
                driver.findElement(By.xpath("//button[contains(text(), 'SIGUIENTE PREGUNTA')]")).click();
            } else {
                driver.findElement(By.xpath("//button[contains(text(), 'FINALIZAR REGISTRO')]")).click();
            }
        }

        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("[role='dialog']")));

        User createdUser = userRepository.findByEmail("laura.nivel@example.com").orElseThrow();
        assertThat(createdUser.getSkillLevel()).isEqualTo(2.25);
    }
}
