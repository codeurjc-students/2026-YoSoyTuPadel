package es.urjc.code.yosoytupadel.backend.system.e2e;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
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
import static org.hamcrest.Matchers.*;

@SpringBootTest (webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class RacketServerSystemTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private RacketRepository racketRepository;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        racketRepository.deleteAll();

        Racket racket1 = new Racket(null, "Babolat", "Pure Aero", "Buen control", 11.5);
        Racket racket2 = new Racket(null, "Wilson", "Blade", "Mucha fuerza de golpeo", 15.0);

        racketRepository.saveAll(List.of(racket1, racket2));
    }

    @Test
    void shouldFetchRacketsFromApi() {
        given()
                .contentType(ContentType.JSON)
                .when()
                .get("/api/rackets")
                .then()
                .statusCode(200)
                .body("$", hasSize(2))
                .body("[0].brand", equalTo("Babolat"))
                .body("[1].brand", equalTo("Wilson"));
    }
}