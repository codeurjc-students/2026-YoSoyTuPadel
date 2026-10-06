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

    @Test
    void shouldAuthenticateAnAdminAndRedirectToTheAdminPanel() {
        login("admin@example.com", "admin-password");

        openPath("/admin");

        wait.until(driver -> driver.getCurrentUrl().contains("admin"));

        assertThat(driver.getCurrentUrl()).contains("admin");
        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("PANEL DE ADMINISTRACIÓN");
    }
}
