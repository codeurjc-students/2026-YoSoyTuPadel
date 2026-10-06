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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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

        court1 = new Court( "Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS);
        court1.setId(1L);
        court2 = new Court( "Coslada", 7.0, CourtType.INDOOR, SurfaceType.WALL);
        court2.setId(2L);

        courtDTO1 = new CourtDTO( 1L,"Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, true);
        courtDTO2 = new CourtDTO( 2L, "Coslada", 7.0, CourtType.INDOOR, SurfaceType.WALL, true);

        preCourtDTO1 = new PreCourtDTO(1L, "Alameda de Osuna", true);
        preCourtDTO2 = new PreCourtDTO(2L, "Coslada", true);

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
    void getCourts_ShouldMapTheRequestedPage() {
        var pageable = PageRequest.of(1, 10);
        when(courtRepository.findAll(pageable))
                .thenReturn(new PageImpl<>(List.of(court2), pageable, 11));
        when(mapper.toPreDTO(court2)).thenReturn(preCourtDTO2);

        var result = courtService.getCourts(pageable);

        assertThat(result.getContent()).containsExactly(preCourtDTO2);
        assertThat(result.getNumber()).isEqualTo(1);
        assertThat(result.getSize()).isEqualTo(10);
        verify(courtRepository).findAll(pageable);
        verify(mapper).toPreDTO(court2);
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
        CourtDTO newCourtDTO = new CourtDTO(null, "Coslada", 8.0, CourtType.INDOOR, SurfaceType.GLASS, true);
        Court newCourt = new Court("Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS);

        Court savedCourt = new Court("Coslada", 8.0, CourtType.INDOOR, SurfaceType.GLASS);
        savedCourt.setId(3L);
        CourtDTO savedCourtDTO = new CourtDTO(3L, "Coslada", 8.0, CourtType.INDOOR, SurfaceType.GLASS,true);

        // Simulamos el flujo completo: DTO -> Entidad -> Repo -> Entidad guardada -> DTO guardado
        when(mapper.toDomain(newCourtDTO)).thenReturn(newCourt);
        when(courtRepository.save(newCourt)).thenReturn(savedCourt);
        when(mapper.toDTO(savedCourt)).thenReturn(savedCourtDTO);

        CourtDTO result = courtService.createCourt(newCourtDTO);

        assertThat(result.id()).isEqualTo(3L);
        assertThat(result.name()).isEqualTo("Coslada");
        assertThat(newCourt.getIsAvailable()).isTrue();
        verify(courtRepository, times(1)).save(newCourt);
    }

    @Test
    void updatePriceUpdatesCourtAndReturnsMappedDto() {
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court1));
        when(courtRepository.save(court1)).thenReturn(court1);
        when(mapper.toDTO(court1)).thenReturn(courtDTO1);

        CourtDTO result = courtService.updatePrice(1L, 12.5);

        assertThat(court1.getCourtPrice()).isEqualTo(12.5);
        assertThat(result).isEqualTo(courtDTO1);
        verify(courtRepository).save(court1);
        verify(mapper).toDTO(court1);
    }

    @Test
    void updatePriceWhenCourtDoesNotExistThrowsNotFound() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courtService.updatePrice(99L, 12.5))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Court not found");

        verify(courtRepository, never()).save(any(Court.class));
        verifyNoInteractions(mapper);
    }

    @Test
    void updateCourtPreservesExistingIdAndReturnsMappedDto() {
        CourtDTO updateDTO = new CourtDTO(null, "Updated", 9.5, CourtType.OUTDOOR, SurfaceType.WALL, false);
        Court updatedCourt = new Court("Updated", 9.5, CourtType.OUTDOOR, SurfaceType.WALL);
        CourtDTO resultDTO = new CourtDTO(1L, "Updated", 9.5, CourtType.OUTDOOR, SurfaceType.WALL, false);
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court1));
        when(mapper.toDomain(updateDTO)).thenReturn(updatedCourt);
        when(courtRepository.save(updatedCourt)).thenReturn(updatedCourt);
        when(mapper.toDTO(updatedCourt)).thenReturn(resultDTO);

        CourtDTO result = courtService.updateCourt(1L, updateDTO);

        assertThat(updatedCourt.getId()).isEqualTo(1L);
        assertThat(result).isEqualTo(resultDTO);
        verify(courtRepository).save(updatedCourt);
    }

    @Test
    void updateCourtWhenCourtDoesNotExistThrowsNotFound() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courtService.updateCourt(99L, courtDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Court not found");

        verifyNoInteractions(mapper);
        verify(courtRepository, never()).save(any(Court.class));
    }

    @Test
    void deleteCourt_WhenCourtDoesNotExist_ShouldThrowNotFoundException() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courtService.deleteCourt(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Court not found");
    }

    @Test
    void deleteCourt_WhenCourtExists_ShouldDeleteSuccessfully() {
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court1));
        when(mapper.toDTO(court1)).thenReturn(courtDTO1);

        CourtDTO result = courtService.deleteCourt(1L);

        assertThat(result).isEqualTo(courtDTO1);
        verify(courtRepository, times(1)).deleteById(1L);
        verify(mapper).toDTO(court1);
    }
}
