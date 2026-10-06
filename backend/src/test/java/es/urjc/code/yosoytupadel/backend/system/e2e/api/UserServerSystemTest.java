package es.urjc.code.yosoytupadel.backend.system.e2e.api;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
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

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class UserServerSystemTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.useRelaxedHTTPSValidation();

        bookingRepository.deleteAll();
        userRepository.deleteAll();

        User admin = new User();
        admin.setEmail("admin@yosoytupadel.com");
        admin.setEncodedPassword(passwordEncoder.encode("admin")); // Guardamos la contraseña encriptada
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);

        User coach = new User();
        coach.setName("Coach Fernando");
        coach.setEmail("fernando@coach.com");
        coach.setEncodedPassword(passwordEncoder.encode("1234"));
        coach.setRole(UserRole.COACH);
        coach.setSkillLevel(8.5);
        coach.setSessionPrice(25.0);
        userRepository.save(coach);
    }

    @Test
    void shouldFetchCoachesFromApi() {
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
                .get("/api/v1/users/coaches")
                .then()
                .statusCode(200)
                .body("content", hasSize(1))
                .body("content[0].name", equalTo("Coach Fernando"));
    }
}