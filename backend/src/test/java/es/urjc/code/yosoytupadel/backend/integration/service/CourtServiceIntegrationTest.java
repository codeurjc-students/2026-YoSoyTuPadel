package es.urjc.code.yosoytupadel.backend.integration.service;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.dto.CourtDTO;
import es.urjc.code.yosoytupadel.backend.dto.PreCourtDTO;
import es.urjc.code.yosoytupadel.backend.entities.Court;
import es.urjc.code.yosoytupadel.backend.entities.CourtType;
import es.urjc.code.yosoytupadel.backend.entities.SurfaceType;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.service.CourtService;
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
class CourtServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private CourtService courtService;

    @Autowired
    private CourtRepository courtRepository;

    @BeforeEach
    void setUp() {
        courtRepository.deleteAll();

        Court court1 = new Court( "Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, 5.0);
        Court court2 = new Court( "Coslada", 7.0, CourtType.INDOOR, SurfaceType.WALL, 5.0);

        courtRepository.saveAll(List.of(court1, court2));
    }

    @Test
    void getAllCourts_ShouldReturnAllCourtsFromDatabase() {

        Collection<PreCourtDTO> result = courtService.getAllCourts();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(PreCourtDTO::name)
                .containsExactlyInAnyOrder("Alameda de Osuna", "Coslada");
    }

    @Test
    void getCourtById_ShouldReturnCorrectCourt() {

        Court saved = courtRepository.findAll().get(0);
        Long id = saved.getId();

        Optional<CourtDTO> result = courtService.getCourtById(id);

        assertThat(result).isPresent();
        assertThat(result.get().name()).isEqualTo(saved.getName());
    }
}
