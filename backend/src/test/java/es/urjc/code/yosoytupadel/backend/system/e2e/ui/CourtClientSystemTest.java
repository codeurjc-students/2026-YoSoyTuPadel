package es.urjc.code.yosoytupadel.backend.system.e2e.ui;

import es.urjc.code.yosoytupadel.backend.entities.Court;
import es.urjc.code.yosoytupadel.backend.entities.CourtType;
import es.urjc.code.yosoytupadel.backend.entities.SurfaceType;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
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
class CourtClientSystemTest extends ClientSystemTestSupport {

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUpData() {
        bookingRepository.deleteAll();
        courtRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.save(new User(
                "player@example.com",
                passwordEncoder.encode("password"),
                UserRole.USER,
                "Test Player"
        ));
        Court court = new Court("Central court", 15.0, CourtType.INDOOR, SurfaceType.GLASS);
        court.setIsAvailable(true);
        courtRepository.save(court);
        openBrowser();
    }

    @Test
    void shouldListCourtsAndOpenTheCourtDetails() {
        openPath("/courts");
        waitForText("Central court");

        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("Disponible");

        login("player@example.com", "password");
        openPath("/courts");
        waitForText("Central court");
        clickAndWaitForPath(By.cssSelector("a[href^='/courts/']"), "/courts/");
        waitForText("Central court");

        assertThat(driver.getCurrentUrl()).contains("/courts/");
        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("ESTADO")
                .contains("Disponible");
    }
}
