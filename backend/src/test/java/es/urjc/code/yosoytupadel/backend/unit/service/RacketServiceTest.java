package es.urjc.code.yosoytupadel.backend.unit.service;

import es.urjc.code.yosoytupadel.backend.dto.PreRacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketMapper;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.assertj.core.api.AssertionsForClassTypes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RacketServiceTest {

    @Mock
    private RacketRepository racketRepository;

    @Mock
    private RacketMapper mapper;

    @InjectMocks
    private RacketService racketService;

    private Racket racket1;
    private Racket racket2;
    private RacketDTO racketDTO1;
    private RacketDTO racketDTO2;

    private PreRacketDTO preRacketDTO1;
    private PreRacketDTO preRacketDTO2;

    @BeforeEach
    void setUp() {

        racket1 = new Racket("Babolat", "Pure Aero", "Buen control", 15.5);
        racket1.setId(1L);
        racket2 = new Racket("Wilson", "Blade", "Mucha potencia de golpeo", 15.0);
        racket2.setId(2L);

        racketDTO1 = new RacketDTO(1L, "Babolat", "Pure Aero", "Buen control", 15.5, 3);
        racketDTO2 = new RacketDTO(2L, "Wilson", "Blade", "Mucha potencia de golpeo", 15.0, 3);

        preRacketDTO1 = new PreRacketDTO(1L, "Babolat", "Pure Aero", 3);
        preRacketDTO2 = new PreRacketDTO(2L, "Wilson", "Blade", 3);
    }

    @Test
    void getAllRackets() {

        List<Racket> rackets = Arrays.asList(racket1, racket2);
        List<PreRacketDTO> preRacketDTOs = Arrays.asList(preRacketDTO1, preRacketDTO2);

        when(racketRepository.findAll()).thenReturn(rackets);
        when(mapper.toPreDTOs(rackets)).thenReturn(preRacketDTOs);

        Collection<PreRacketDTO> result = racketService.getAllRackets();

        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(preRacketDTO1, preRacketDTO2);
        verify(racketRepository, times(1)).findAll();
    }

    @Test
    void getRacketById() {
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));
        when(mapper.toDTO(racket1)).thenReturn(racketDTO1);

        Optional<RacketDTO> result = racketService.getRacketById(1L);

        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(racketDTO1);
        verify(racketRepository, times(1)).findById(1L);
    }

    @Test
    void getRacketById_WhenRacketDoesNotExist() {
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<RacketDTO> result = racketService.getRacketById(99L);

        assertThat(result).isEmpty();
        verify(racketRepository, times(1)).findById(99L);
    }

    @Test
    void createRacket() throws SQLException, IOException {
        RacketDTO newRacketDTO = new RacketDTO(null, "Head", "Speed", "Lightweight", 18.0,3);
        Racket newRacket = new Racket("Head", "Speed", "Lightweight", 18.0);

        Racket savedRacket = new Racket("Head", "Speed", "Lightweight", 18.0);
        savedRacket.setId(3L);
        RacketDTO savedRacketDTO = new RacketDTO(3L, "Head", "Speed", "Lightweight", 18.0, 3);

        // Simulamos el flujo completo: DTO -> Entidad -> Repo -> Entidad guardada -> DTO guardado
        when(mapper.toDomain(newRacketDTO)).thenReturn(newRacket);
        when(racketRepository.save(newRacket)).thenReturn(savedRacket);
        when(mapper.toDTO(savedRacket)).thenReturn(savedRacketDTO);

        RacketDTO result = racketService.createRacket(newRacketDTO);

        assertThat(result.id()).isEqualTo(3L);
        assertThat(result.brand()).isEqualTo("Head");
        verify(racketRepository, times(1)).save(newRacket);
    }

    @Test
    void deleteRacket_WhenRacketDoesNotExist_ShouldThrowNotFoundException() {
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        AssertionsForClassTypes.assertThatThrownBy(() -> racketService.deleteRacket(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Racket not found");
    }
}
