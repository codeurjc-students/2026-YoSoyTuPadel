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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.sql.SQLException;
import java.util.NoSuchElementException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
        assertThat(newRacket.getImage()).isNotNull();
        verify(racketRepository, times(1)).save(newRacket);
    }

    @Test
    void createRacketFromEntityAddsDefaultImageAndSaves() throws SQLException, IOException {
        Racket newRacket = new Racket("Head", "Speed", "Lightweight", 18.0);
        when(racketRepository.save(newRacket)).thenReturn(newRacket);

        Racket result = racketService.createRacket(newRacket);

        assertThat(result).isSameAs(newRacket);
        assertThat(result.getImage()).isNotNull();
        verify(racketRepository).save(newRacket);
    }

    @Test
    void updateRacketReusesExistingIdAndReturnsUpdatedDto() {
        RacketDTO updateDTO = new RacketDTO(null, "Head", "Speed", "Fast", 18.0, 4);
        Racket updatedRacket = new Racket("Head", "Speed", "Fast", 18.0);
        RacketDTO resultDTO = new RacketDTO(1L, "Head", "Speed", "Fast", 18.0, 4);
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));
        when(mapper.toDomain(updateDTO)).thenReturn(updatedRacket);
        when(racketRepository.save(updatedRacket)).thenReturn(updatedRacket);
        when(mapper.toDTO(updatedRacket)).thenReturn(resultDTO);

        assertThat(racketService.updateRacket(1L, updateDTO)).isEqualTo(resultDTO);
        assertThat(updatedRacket.getId()).isEqualTo(1L);
        verify(racketRepository).save(updatedRacket);
    }

    @Test
    void updateRacketWhenMissingThrowsNotFound() {
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> racketService.updateRacket(99L, racketDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Racket not found");

        verify(mapper, never()).toDomain(any(RacketDTO.class));
        verify(racketRepository, never()).save(any(Racket.class));
    }

    @Test
    void deleteRacket_WhenRacketDoesNotExist_ShouldThrowNotFoundException() {
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        AssertionsForClassTypes.assertThatThrownBy(() -> racketService.deleteRacket(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Racket not found");
    }

    @Test
    void deleteRacket_WhenRacketExists_ShouldDeleteSuccessfully() {
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));
        when(mapper.toDTO(racket1)).thenReturn(racketDTO1);

        assertThat(racketService.deleteRacket(1L)).isEqualTo(racketDTO1);

        verify(racketRepository, times(1)).delete(racket1);
    }

    @Test
    void getRacketImageReturnsStreamForExistingImage() throws SQLException, IOException {
        racket1.setImage(new javax.sql.rowset.serial.SerialBlob(new byte[]{1, 2, 3}));
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));

        assertThat(racketService.getRacketImage(1L).getInputStream().readAllBytes())
                .containsExactly(1, 2, 3);
    }

    @Test
    void getRacketImageWhenRacketIsMissingThrowsNotFound() {
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> racketService.getRacketImage(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Racket not found");
    }

    @Test
    void getRacketImageWhenImageIsMissingThrowsNoSuchElement() {
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));

        assertThatThrownBy(() -> racketService.getRacketImage(1L))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void replaceRacketImageUpdatesAndSavesImage() {
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));

        racketService.replaceRacketImage(1L, new ByteArrayInputStream(new byte[]{1, 2, 3}), 3L);

        assertThat(racket1.getImage()).isNotNull();
        verify(racketRepository).save(racket1);
    }

    @Test
    void replaceRacketImageWhenRacketIsMissingThrowsNotFound() {
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> racketService.replaceRacketImage(99L, new ByteArrayInputStream(new byte[0]), 0L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Racket not found");

        verify(racketRepository, never()).save(any(Racket.class));
    }

    @Test
    void deleteRacketImageReplacesImageWithDefaultAndSaves() throws IOException, SQLException {
        racket1.setImage(new javax.sql.rowset.serial.SerialBlob(new byte[]{1}));
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));

        racketService.deleteRacketImage(1L);

        assertThat(racket1.getImage()).isNotNull();
        verify(racketRepository).save(racket1);
    }

    @Test
    void deleteRacketImageWhenRacketIsMissingThrowsNotFound() {
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> racketService.deleteRacketImage(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Racket not found");

        verify(racketRepository, never()).save(any(Racket.class));
    }

    @Test
    void deleteRacketImageWhenImageIsMissingThrowsNoSuchElement() {
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket1));

        assertThatThrownBy(() -> racketService.deleteRacketImage(1L))
                .isInstanceOf(NoSuchElementException.class);

        verify(racketRepository, never()).save(any(Racket.class));
    }
}
