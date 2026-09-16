package es.urjc.code.yosoytupadel.backend.unit.controller;

import es.urjc.code.yosoytupadel.backend.controller.RacketController;
import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketMapper;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RacketControllerTest {

    @Mock
    private RacketService racketService;

    @Mock
    private RacketMapper racketMapper;

    @InjectMocks
    private RacketController racketController;

    private Racket racket1;
    private Racket racket2;

    @BeforeEach
    void setUp() {
        racket1 = new Racket( "Babolat", "Pure Aero", "Buen control", 14.5);
        racket1.setId(1L);
        racket2 = new Racket("Wilson", "Blade", "Mucha fuerza de golpeo", 15.0);
        racket2.setId(2L);
    }

    @Test
    void getAllRackets_ShouldReturnListOfRackets() {

        RacketDTO dto1 = new RacketDTO(1L, "Pure Aero", "Babolat", "Buen control", 14.5);
        RacketDTO dto2 = new RacketDTO(2L, "Blade", "Wilson", "Mucha fuerza de golpeo", 15.0);

        when(racketService.getAllRackets()).thenReturn(Arrays.asList(racket1, racket2));

        when(racketMapper.toDTOs(any())).thenReturn(Arrays.asList(dto1, dto2));

        Collection<RacketDTO> result = racketController.getAllRackets();

        assertThat(result).hasSize(2);

        RacketDTO dto = result.iterator().next();
        assertThat(result)
                .extracting(RacketDTO::brand)
                .containsExactly("Babolat", "Wilson");

        verify(racketService, times(1)).getAllRackets();
    }

    @Test
    void getAllRackets_WhenServiceReturnsEmptyList_ShouldReturnEmptyList() {

        when(racketService.getAllRackets()).thenReturn(Arrays.asList());

        Collection<RacketDTO> result = racketController.getAllRackets();

        assertThat(result).isEmpty();
        verify(racketService, times(1)).getAllRackets();
    }
}
