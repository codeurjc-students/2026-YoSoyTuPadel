package es.urjc.code.yosoytupadel.backend.integration.service;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
class RacketServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private RacketService racketService;
    @Autowired
    private RacketRepository racketRepository;

    @BeforeEach
    void setUp() {
        racketRepository.deleteAll();

        Racket racket1 = new Racket(null, "Babolat", "Pure Aero", "Buen control", 10.5);
        Racket racket2 = new Racket(null, "Wilson", "Blade", "Mucha fuerza de golpeo", 15.0);

        racketRepository.saveAll(List.of(racket1, racket2));
    }

    @Test
    void getAllRackets_ShouldReturnAllRacketsFromDatabase() {

        List<Racket> result = racketService.getAllRackets();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Racket::getBrand)
                .containsExactly("Babolat", "Wilson");
    }

    @Test
    void getRacketById_ShouldReturnCorrectRacket() {

        Racket saved = racketRepository.findAll().get(0);
        Long id = saved.getId();

        Racket result = racketService.getRacketById(id);

        assertThat(result.getBrand()).isEqualTo("Babolat");
        assertThat(result.getName()).isEqualTo("Pure Aero");
    }
}
