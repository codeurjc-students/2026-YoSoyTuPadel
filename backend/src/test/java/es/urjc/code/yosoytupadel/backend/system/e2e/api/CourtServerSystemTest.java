package es.urjc.code.yosoytupadel.backend.system.e2e.api;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.entities.*;
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

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;

@SpringBootTest (webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class CourtServerSystemTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long courtWithCoordsId;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.useRelaxedHTTPSValidation();

        courtRepository.deleteAll();
        userRepository.deleteAll();

        User user = new User();
        user.setName("Test User");
        user.setEmail("user@yosoytupadel.com");
        user.setEncodedPassword(passwordEncoder.encode("1234"));
        user.setRole(UserRole.USER);
        userRepository.save(user);

        Court court1 = new Court( "Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, 40.453, -3.588);
        Court court2 = new Court( "Coslada", 7.0, CourtType.INDOOR, SurfaceType.WALL, null, null);

        List<Court> saved = courtRepository.saveAll(List.of(court1, court2));
        courtWithCoordsId = saved.get(0).getId();
    }

    @Test
    void shouldFetchCourtsFromApi() {
        given()
                .contentType(ContentType.JSON)
                .when()
                .get("/api/v1/courts")
                .then()
                .statusCode(200)
                .body("content", hasSize(2))
                .body("content.name", hasItems("Alameda de Osuna", "Coslada"))
                .body("content[0].latitude", is(40.453f))
                .body("content[0].longitude", is(-3.588f))
                .body("content[1].latitude", nullValue())
                .body("content[1].longitude", nullValue());
    }

    @Test
    void shouldFetchCourtDetailsWithCoordinates() {
        String authToken = given()
                .contentType(ContentType.JSON)
                .body("{ \"email\": \"user@yosoytupadel.com\", \"password\": \"1234\" }")
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
                .get("/api/v1/courts/" + courtWithCoordsId)
                .then()
                .statusCode(200)
                .body("name", is("Alameda de Osuna"))
                .body("latitude", is(40.453f))
                .body("longitude", is(-3.588f));
    }
}