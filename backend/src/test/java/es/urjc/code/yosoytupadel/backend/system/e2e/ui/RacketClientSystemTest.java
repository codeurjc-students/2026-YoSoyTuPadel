package es.urjc.code.yosoytupadel.backend.system.e2e.ui;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
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
class RacketClientSystemTest extends ClientSystemTestSupport {

    @Autowired
    private RacketRepository racketRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUpData() {
        bookingRepository.deleteAll();
        racketRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.save(new User(
                "player@example.com",
                passwordEncoder.encode("password"),
                UserRole.USER,
                "Test Player"
        ));
        Racket racket = racketRepository.save(
                new Racket("Babolat", "Pure Aero", "Control racket", 13.5)
        );
        racket.setStock(3);
        racketRepository.save(racket);
        openBrowser();
    }

    @Test
    void shouldDisplayRacketCatalogueAndOpenRacketDetails() {
        openPath("/rackets");
        waitForText("Babolat - Pure Aero");

        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("3 palas disponibles");

        login("player@example.com", "password");
        openPath("/rackets");
        waitForText("Babolat - Pure Aero");
        clickAndWaitForPath(
                By.cssSelector("a[href^='/rackets/']"),
                "/rackets/"
        );
        waitForText("Babolat");

        assertThat(driver.getCurrentUrl()).contains("/rackets/");
        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("PRECIO")
                .contains("Stock disponible: 3");
    }
}
