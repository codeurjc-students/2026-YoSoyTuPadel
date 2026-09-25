package es.urjc.code.yosoytupadel.backend.system.e2e;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.entities.*;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalTime;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class BookingServerSystemTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.useRelaxedHTTPSValidation();

        bookingRepository.deleteAll();
        courtRepository.deleteAll();
        userRepository.deleteAll();

        Court court = new Court("Pista Central", 8.0, CourtType.INDOOR, SurfaceType.GLASS);
        court.setIsAvailable(true);
        court = courtRepository.save(court);

        // Creamos un admin ya que lo necesitamos para la peticion api posterior
        User admin = new User();
        admin.setEmail("admin@yosoytupadel.com");
        admin.setEncodedPassword(passwordEncoder.encode("admin")); // Guardamos la contraseña encriptada
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);

        // El usuario propietario de la reserva
        User student = new User("victor@alumno.com", passwordEncoder.encode("pass"), UserRole.USER);
        userRepository.save(student);

        Booking booking = new Booking();
        booking.setCourt(court);
        booking.setUser(student);
        booking.setBookingDate(LocalDate.now().plusDays(2));
        booking.setStartTime(LocalTime.of(12, 0));
        booking.setEndTime(LocalTime.of(13, 30));
        booking.setStatus(BookingStatus.PENDING);
        booking.setType(BookingType.MATCH);
        booking.setBookingPrice(8.0);

        bookingRepository.save(booking);
    }

    @Test
    void shouldFetchBookingsFromApi() {

        // Simulamos el login del Frontend para obtener el JWT real
        String authToken = given()
                .contentType(ContentType.JSON)
                .body("{ \"email\": \"admin@yosoytupadel.com\", \"password\": \"admin\" }")
                .when()
                .post("/api/v1/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .cookie("AuthToken");

        given()
                .contentType(ContentType.JSON)
                .cookie("AuthToken", authToken)
                .when()
                .get("/api/v1/bookings")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].type", equalTo("MATCH"));
    }
}