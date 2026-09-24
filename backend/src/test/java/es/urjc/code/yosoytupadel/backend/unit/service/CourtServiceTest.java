package es.urjc.code.yosoytupadel.backend.unit.service;

import es.urjc.code.yosoytupadel.backend.dto.*;
import es.urjc.code.yosoytupadel.backend.entities.Court;
import es.urjc.code.yosoytupadel.backend.entities.CourtType;
import es.urjc.code.yosoytupadel.backend.entities.SurfaceType;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.service.CourtService;
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
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourtServiceTest {

    @Mock
    private CourtRepository courtRepository;

    @Mock
    private CourtMapper mapper;

    @InjectMocks
    private CourtService courtService;

    private Court court1;
    private Court court2;
    private CourtDTO courtDTO1;
    private CourtDTO courtDTO2;

    private PreCourtDTO preCourtDTO1;
    private PreCourtDTO preCourtDTO2;

    @BeforeEach
    void setUp() {

        court1 = new Court( "Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, 5.0);
        court1.setId(1L);
        court2 = new Court( "Coslada", 7.0, CourtType.INDOOR, SurfaceType.WALL, 5.0);
        court2.setId(2L);

        courtDTO1 = new CourtDTO( 1L,"Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, true, 5.0);
        courtDTO2 = new CourtDTO( 2L, "Coslada", 7.0, CourtType.INDOOR, SurfaceType.WALL, true, 5.0);

        preCourtDTO1 = new PreCourtDTO(1L,"Alameda de Osuna", true);
        preCourtDTO2 = new PreCourtDTO(2L, "Coslada", true );

    }

    @Test
    void getAllCourts() {

        List<Court> courts = Arrays.asList(court1, court2);
        List<PreCourtDTO> preCourtDTOs = Arrays.asList(preCourtDTO1, preCourtDTO2);

        when(courtRepository.findAll()).thenReturn(courts);
        when(mapper.toPreDTOs(courts)).thenReturn(preCourtDTOs);

        Collection<PreCourtDTO> result = courtService.getAllCourts();

        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(preCourtDTO1, preCourtDTO2);
        verify(courtRepository, times(1)).findAll();
    }

    @Test
    void getCourtById() {
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court1));
        when(mapper.toDTO(court1)).thenReturn(courtDTO1);

        Optional<CourtDTO> result = courtService.getCourtById(1L);

        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(courtDTO1);
        verify(courtRepository, times(1)).findById(1L);
    }

    @Test
    void getCourtById_WhenCourtDoesNotExist() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<CourtDTO> result = courtService.getCourtById(99L);

        assertThat(result).isEmpty();
        verify(courtRepository, times(1)).findById(99L);
    }

    @Test
    void createCourt() throws SQLException, IOException {
        CourtDTO newCourtDTO = new CourtDTO(null, "Coslada", 8.0, CourtType.INDOOR, SurfaceType.GLASS, true, 5.0);
        Court newCourt = new Court("Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, 5.0);

        Court savedCourt = new Court("Coslada", 8.0, CourtType.INDOOR, SurfaceType.GLASS,  5.0);
        savedCourt.setId(3L);
        CourtDTO savedCourtDTO = new CourtDTO(3L, "Coslada", 8.0, CourtType.INDOOR, SurfaceType.GLASS,true,   5.0);

        // Simulamos el flujo completo: DTO -> Entidad -> Repo -> Entidad guardada -> DTO guardado
        when(mapper.toDomain(newCourtDTO)).thenReturn(newCourt);
        when(courtRepository.save(newCourt)).thenReturn(savedCourt);
        when(mapper.toDTO(savedCourt)).thenReturn(savedCourtDTO);

        CourtDTO result = courtService.createCourt(newCourtDTO);

        assertThat(result.id()).isEqualTo(3L);
        assertThat(result.name()).isEqualTo("Coslada");
        verify(courtRepository, times(1)).save(newCourt);
    }

    @Test
    void deleteCourt_WhenCourtDoesNotExist_ShouldThrowNotFoundException() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courtService.deleteCourt(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Court not found");
    }
}
