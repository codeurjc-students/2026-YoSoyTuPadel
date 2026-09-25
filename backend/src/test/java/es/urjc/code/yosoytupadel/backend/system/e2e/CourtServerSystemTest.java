package es.urjc.code.yosoytupadel.backend.system.e2e;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.entities.Court;
import es.urjc.code.yosoytupadel.backend.entities.CourtType;
import es.urjc.code.yosoytupadel.backend.entities.SurfaceType;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.hasSize;

@SpringBootTest (webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class CourtServerSystemTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private CourtRepository courtRepository;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.useRelaxedHTTPSValidation();

        courtRepository.deleteAll();

        Court court1 = new Court( "Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS);
        Court court2 = new Court( "Coslada", 7.0, CourtType.INDOOR, SurfaceType.WALL);

        courtRepository.saveAll(List.of(court1, court2));
    }

    @Test
    void shouldFetchCourtsFromApi() {
        given()
                .contentType(ContentType.JSON)
                .when()
                .get("/api/v1/courts")
                .then()
                .statusCode(200)
                .body("$", hasSize(2))
                .body("name", hasItems("Alameda de Osuna", "Coslada"));
    }
}