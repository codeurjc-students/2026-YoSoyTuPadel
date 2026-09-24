package es.urjc.code.yosoytupadel.backend.unit.service;

import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.BookingMapper;
import es.urjc.code.yosoytupadel.backend.entities.*;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private CourtRepository courtRepository;

    @Mock
    private BookingMapper mapper;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BookingService bookingService;

    private Booking booking1;
    private BookingDTO bookingDTO1;
    private Court court;

    User user;

    @BeforeEach
    void setUp() {
        court = new Court("Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, 5.0);
        court.setId(1L);
        court.setIsAvailable(true);

        booking1 = new Booking();
        booking1.setId(1L);
        booking1.setBookingDate(LocalDate.now().plusDays(2)); // Fecha válida
        booking1.setStartTime(LocalTime.of(10, 0));
        booking1.setEndTime(LocalTime.of(11, 0));
        booking1.setCourt(court);
        booking1.setStatus(BookingStatus.PENDING);
        booking1.setType(BookingType.MATCH);

        // Simulamos un DTO genérico
        bookingDTO1 = mock(BookingDTO.class);
    }

    @Test
    void getAllBookings_ShouldReturnList() {
        List<Booking> bookings = Arrays.asList(booking1);
        List<BookingDTO> dtos = Arrays.asList(bookingDTO1);

        when(bookingRepository.findAll()).thenReturn(bookings);
        when(mapper.toDTOs(bookings)).thenReturn(dtos);

        Collection<BookingDTO> result = bookingService.getAllBookings();

        assertThat(result).hasSize(1);
        verify(bookingRepository, times(1)).findAll();
    }

    @Test
    void createBooking_WhenValid_ShouldSaveAndReturnDTO() {
        User student = new User();
        student.setId(2L);
        student.setRole(UserRole.USER);

        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(2));
        when(bookingDTO1.courtId()).thenReturn(1L);
        when(bookingDTO1.coachId()).thenReturn(null);
        when(bookingDTO1.startTime()).thenReturn(LocalTime.of(10, 0));
        when(bookingDTO1.endTime()).thenReturn(LocalTime.of(11, 0));
        when(bookingDTO1.userId()).thenReturn(2L);

        when(mapper.toDomain(bookingDTO1)).thenReturn(booking1);

        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        when(bookingRepository.existsOverlappingBooking(
                eq(1L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)
        )).thenReturn(false);

        when(bookingRepository.save(any(Booking.class))).thenReturn(booking1);
        when(mapper.toDTO(booking1)).thenReturn(bookingDTO1);

        BookingDTO result = bookingService.createBooking(bookingDTO1);

        assertThat(result).isEqualTo(bookingDTO1);
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void createBooking_WhenDateInPast_ShouldThrowBadRequest() {
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().minusDays(1));

        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("past");

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_WhenOverlapping_ShouldThrowConflict() {
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(2));

        when(bookingDTO1.courtId()).thenReturn(1L);
        when(bookingDTO1.coachId()).thenReturn(null);

        when(bookingDTO1.startTime()).thenReturn(LocalTime.of(10, 0));
        when(bookingDTO1.endTime()).thenReturn(LocalTime.of(11, 0));

        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));

        when(bookingRepository.existsOverlappingBooking(
                eq(1L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)
        )).thenReturn(true);

        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("The selected time slot is already reserved.");

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBooking_ShouldUpdateStatus() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));
        when(bookingRepository.save(booking1)).thenReturn(booking1);
        when(mapper.toDTO(booking1)).thenReturn(bookingDTO1);

        bookingService.cancelBooking(1L);

        // Verificamos que el estado ha cambiado antes de guardarse
        assertThat(booking1.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(bookingRepository, times(1)).save(booking1);
    }

    @Test
    void createBooking_WhenCoachIsOverlapping_ShouldThrowConflict() {

        User coach = new User();
        coach.setId(3L);
        coach.setRole(UserRole.COACH);

        BookingDTO trainingDTO = mock(BookingDTO.class);
        when(trainingDTO.bookingDate()).thenReturn(LocalDate.now().plusDays(2));
        when(trainingDTO.courtId()).thenReturn(null);
        when(trainingDTO.coachId()).thenReturn(3L);
        when(trainingDTO.startTime()).thenReturn(LocalTime.of(10, 0));
        when(trainingDTO.endTime()).thenReturn(LocalTime.of(11, 0));

        when(userRepository.findById(3L)).thenReturn(Optional.of(coach));

        when(bookingRepository.existsOverlappingCoachBooking(
                eq(3L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class))
        ).thenReturn(true);

        // Excepción 409 Conflict
        assertThatThrownBy(() -> bookingService.createBooking(trainingDTO))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already has a class");

        verify(bookingRepository, never()).save(any());
    }
}
