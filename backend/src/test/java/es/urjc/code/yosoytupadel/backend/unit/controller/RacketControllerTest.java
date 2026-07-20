package es.urjc.code.yosoytupadel.backend.unit.controller;

import es.urjc.code.yosoytupadel.backend.controller.RacketController;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RacketControllerTest {

    @Mock
    private RacketService racketService;

    @InjectMocks
    private RacketController racketController;

    private Racket racket1;
    private Racket racket2;

    @BeforeEach
    void setUp() {
            racket1 = new Racket(1L, "Babolat", "Pure Aero", "Buen control", 14.5);
        racket2 = new Racket(2L, "Wilson", "Blade", "Mucha fuerza de golpeo", 15.0);
    }

    @Test
    void getAllRackets_ShouldReturnListOfRackets() {

        when(racketService.getAllRackets()).thenReturn(Arrays.asList(racket1, racket2));

        List<Racket> result = racketController.getAllRackets();

        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(racket1, racket2);
        assertThat(result.get(0).getBrand()).isEqualTo("Babolat");
        assertThat(result.get(1).getBrand()).isEqualTo("Wilson");

        verify(racketService, times(1)).getAllRackets();
    }

    @Test
    void getAllRackets_WhenServiceReturnsEmptyList_ShouldReturnEmptyList() {

        when(racketService.getAllRackets()).thenReturn(Arrays.asList());

        List<Racket> result = racketController.getAllRackets();

        assertThat(result).isEmpty();
        verify(racketService, times(1)).getAllRackets();
    }
}
