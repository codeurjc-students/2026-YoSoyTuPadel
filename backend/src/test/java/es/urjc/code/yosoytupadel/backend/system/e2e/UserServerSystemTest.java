package es.urjc.code.yosoytupadel.backend.system.e2e;

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

        given()
                .contentType(ContentType.JSON)
                .when()
                .get("/api/v1/users/coachs")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].name", equalTo("Coach Fernando"));
    }
}