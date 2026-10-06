package es.urjc.code.yosoytupadel.backend.system.e2e.ui;

import es.urjc.code.yosoytupadel.backend.entities.Booking;
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

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@TestPropertySource(properties = "server.port=8443")
class BookingClientSystemTest extends ClientSystemTestSupport {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUpData() {
        bookingRepository.deleteAll();
        courtRepository.deleteAll();
        userRepository.deleteAll();

        User player = userRepository.save(new User(
                "player@example.com",
                passwordEncoder.encode("password"),
                UserRole.USER,
                "Test Player"
        ));
        Court court = courtRepository.save(
                new Court("Central court", 15.0, CourtType.INDOOR, SurfaceType.GLASS)
        );
        bookingRepository.save(new Booking(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                15.0,
                player,
                court
        ));
        openBrowser();
    }

    @Test
    void shouldDisplayAuthenticatedUserActiveBookings() {
        login("player@example.com", "password");
        openPath("/bookings");
        waitForText("Mis reservas");

        wait.until(org.openqa.selenium.support.ui.ExpectedConditions.textToBePresentInElementLocated(
                By.tagName("body"), "Central court"
        ));

        assertThat(driver.findElement(By.tagName("body")).getText())
                .contains("Central court");
    }
}
