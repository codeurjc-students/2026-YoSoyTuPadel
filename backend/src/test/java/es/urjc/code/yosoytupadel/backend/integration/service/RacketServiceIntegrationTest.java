package es.urjc.code.yosoytupadel.backend.integration.service;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.dto.PreRacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

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

        Racket racket1 = new Racket( "Babolat", "Pure Aero", "Buen control", 10.5);
        Racket racket2 = new Racket( "Wilson", "Blade", "Mucha fuerza de golpeo", 15.0);

        racketRepository.saveAll(List.of(racket1, racket2));
    }

    @Test
    void getAllRackets_ShouldReturnAllRacketsFromDatabase() {

        Collection<PreRacketDTO> result = racketService.getAllRackets();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(PreRacketDTO::brand)
                .containsExactlyInAnyOrder("Babolat", "Wilson");
    }

    @Test
    void getRacketById_ShouldReturnCorrectRacket() {

        Racket saved = racketRepository.findAll().get(0);
        Long id = saved.getId();

        Optional<RacketDTO> result = racketService.getRacketById(id);

        assertThat(result).isPresent();
        assertThat(result.get().brand()).isEqualTo(saved.getBrand());
        assertThat(result.get().name()).isEqualTo(saved.getName());
    }
}
