package es.urjc.code.yosoytupadel.backend.unit.service;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RacketServiceTest {

    @Mock
    private RacketRepository racketRepository;

    @InjectMocks
    private RacketService racketService;

    private Racket racket1;
    private Racket racket2;

    @BeforeEach
    void setUp() {

        racket1 = new Racket(1L, "Babolat", "Pure Aero", "Buen control", 15.5);
        racket2 = new Racket(2L, "Wilson", "Blade", "Mucha potencia de golpeo", 15.0);
    }

    @Test
    void getAllRackets() {

        when(racketRepository.findAll()).thenReturn(Arrays.asList(racket1, racket2));


        List<Racket> result = racketService.getAllRackets();

        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(racket1, racket2);

        verify(racketRepository, times(1)).findAll();
    }

    @Test
    void getRacketById() {
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));

        Racket result = racketService.getRacketById(1L);

        assertThat(result).isEqualTo(racket1);
        verify(racketRepository, times(1)).findById(1L);
    }

    @Test
    void getRacketById_WhenRacketDoesNotExist() {
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> racketService.getRacketById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Racket not found");

        verify(racketRepository, times(1)).findById(99L);
    }

    @Test
    void createRacket() {
        Racket newRacket = new Racket(null, "Head", "Speed", "Lightweight", 18.0);
        Racket savedRacket = new Racket(3L, "Head", "Speed", "Lightweight", 18.0);

        when(racketRepository.save(any(Racket.class))).thenReturn(savedRacket);

        Racket result = racketService.createRacket(newRacket);

        assertThat(result.getId()).isEqualTo(3L);
        assertThat(result.getBrand()).isEqualTo("Head");
        verify(racketRepository, times(1)).save(newRacket);
    }
}
