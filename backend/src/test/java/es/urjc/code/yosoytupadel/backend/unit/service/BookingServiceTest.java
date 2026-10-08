package es.urjc.code.yosoytupadel.backend.unit.service;

import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.BookingMapper;
import es.urjc.code.yosoytupadel.backend.entities.*;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import es.urjc.code.yosoytupadel.backend.service.UserService;
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

    @Mock
    private UserService userService;

    @InjectMocks
    private BookingService bookingService;

    private Booking booking1;
    private BookingDTO bookingDTO1;
    private Court court;

    User user;

    @BeforeEach
    void setUp() {
        court = new Court("Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS);
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

        // We simulate a generic DTO
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
    void getReservedCourtSlots_ShouldReturnHourlySlotsThatOverlapActiveBookings() {
        booking1.setStartTime(LocalTime.of(10, 30));
        booking1.setEndTime(LocalTime.of(11, 30));
        when(bookingRepository.findActiveCourtBookings(1L, LocalDate.now().plusDays(1)))
                .thenReturn(List.of(booking1));

        List<LocalTime> result = bookingService.getReservedCourtSlots(1L, LocalDate.now().plusDays(1));

        assertThat(result).containsExactly(LocalTime.of(10, 0), LocalTime.of(11, 0));
        verify(bookingRepository).findActiveCourtBookings(1L, LocalDate.now().plusDays(1));
    }

    @Test
    void getReservedCoachSlots_ShouldReturnTwoHourSlotsThatOverlapActiveBookings() {
        User coach = new User();
        coach.setId(3L);
        booking1.setCoach(coach);
        booking1.setCourt(null);
        booking1.setStartTime(LocalTime.of(10, 30));
        booking1.setEndTime(LocalTime.of(12, 30));
        LocalDate date = LocalDate.now().plusDays(1);
        when(bookingRepository.findActiveCoachBookings(3L, date)).thenReturn(List.of(booking1));

        List<LocalTime> result = bookingService.getReservedCoachSlots(3L, date);

        assertThat(result).containsExactly(LocalTime.of(9, 0), LocalTime.of(11, 0));
        verify(bookingRepository).findActiveCoachBookings(3L, date);
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

    @Test
    void createBooking_WhenDateIsNull_ShouldThrowBadRequest() {
        // Given
        when(bookingDTO1.bookingDate()).thenReturn(null);

        // When / Then
        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("past");
        verify(courtRepository, never()).findById(anyLong());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_WhenDateIsTooFar_ShouldThrowBadRequest() {
        // Given
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusWeeks(2).plusDays(1));

        // When / Then
        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("14 days");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_WhenCourtAndCoachAreBothPresent_ShouldThrowBadRequest() {
        // Given
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(1));
        when(bookingDTO1.courtId()).thenReturn(1L);
        when(bookingDTO1.coachId()).thenReturn(3L);

        // When / Then
        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("both");
        verify(courtRepository, never()).findById(anyLong());
        verify(userRepository, never()).findById(anyLong());
    }

    @Test
    void createBooking_WhenCourtAndCoachAreMissing_ShouldThrowBadRequest() {
        // Given
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(1));
        when(bookingDTO1.courtId()).thenReturn(null);
        when(bookingDTO1.coachId()).thenReturn(null);

        // When / Then
        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("either");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_WhenCourtIsClosed_ShouldThrowBadRequest() {
        // Given
        court.setIsAvailable(false);
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(1));
        when(bookingDTO1.courtId()).thenReturn(1L);
        when(bookingDTO1.coachId()).thenReturn(null);
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));

        // When / Then
        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("closed");
        verify(bookingRepository, never()).existsOverlappingBooking(anyLong(), any(), any(), any());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_WhenCourtDoesNotExist_ShouldThrowNotFound() {
        // Given
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(1));
        when(bookingDTO1.courtId()).thenReturn(1L);
        when(bookingDTO1.coachId()).thenReturn(null);
        when(courtRepository.findById(1L)).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Court not found");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_WhenUserIsNotAuthenticated_ShouldThrowUnauthorized() {
        // Given
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(1));
        when(bookingDTO1.courtId()).thenReturn(1L);
        when(bookingDTO1.coachId()).thenReturn(null);
        when(bookingDTO1.userId()).thenReturn(null);
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));
        when(bookingRepository.existsOverlappingBooking(anyLong(), any(), any(), any())).thenReturn(false);
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("not authenticated");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBooking_WhenAlreadyCancelled_ShouldThrowBadRequest() {
        // Given
        booking1.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));

        // When / Then
        assertThatThrownBy(() -> bookingService.cancelBooking(1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already been cancelled");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBooking_WhenCompleted_ShouldThrowBadRequest() {
        // Given
        booking1.setStatus(BookingStatus.COMPLETED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));

        // When / Then
        assertThatThrownBy(() -> bookingService.cancelBooking(1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already finished");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void deleteBooking_WhenBookingDoesNotExist_ShouldThrowNotFound() {
        // Given
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> bookingService.deleteBooking(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Booking not found");
        verify(bookingRepository, never()).delete(any());
    }

    @Test
    void getAllBookingsByUserId_ShouldReturnList() {
        List<Booking> bookings = Arrays.asList(booking1);
        List<BookingDTO> dtos = Arrays.asList(bookingDTO1);

        when(bookingRepository.findByUserId(2L)).thenReturn(bookings);
        when(mapper.toDTOs(bookings)).thenReturn(dtos);

        Collection<BookingDTO> result = bookingService.getAllBookingsByUserId(2L);

        assertThat(result).hasSize(1);
        verify(bookingRepository, times(1)).findByUserId(2L);
    }

    @Test
    void getBookingsForCoach_ShouldReturnCoachBookings() {
        User client = new User();
        client.setId(5L);
        booking1.setUser(client);

        List<Booking> bookings = Arrays.asList(booking1);
        es.urjc.code.yosoytupadel.backend.dto.UserDTO clientDto = mock(es.urjc.code.yosoytupadel.backend.dto.UserDTO.class);

        when(bookingRepository.findByCoachId(3L)).thenReturn(bookings);
        when(mapper.toDTO(booking1)).thenReturn(bookingDTO1);
        when(userService.getUserById(5L)).thenReturn(Optional.of(clientDto));

        Collection<es.urjc.code.yosoytupadel.backend.dto.CoachBookingDTO> result = bookingService.getBookingsForCoach(3L);

        assertThat(result).hasSize(1);
        verify(bookingRepository, times(1)).findByCoachId(3L);
    }

    @Test
    void getBookingsForCoach_WhenClientNotFound_ShouldThrowNotFound() {
        User client = new User();
        client.setId(5L);
        booking1.setUser(client);

        List<Booking> bookings = Arrays.asList(booking1);

        when(bookingRepository.findByCoachId(3L)).thenReturn(bookings);
        when(userService.getUserById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.getBookingsForCoach(3L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Client not found");
    }

    @Test
    void getBookingById_WhenExists_ShouldReturnDTO() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));
        when(mapper.toDTO(booking1)).thenReturn(bookingDTO1);

        Optional<BookingDTO> result = bookingService.getBookingById(1L);

        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(bookingDTO1);
    }

    @Test
    void deleteBooking_ShouldDeleteAndReturnDTO() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));
        when(mapper.toDTO(booking1)).thenReturn(bookingDTO1);

        BookingDTO result = bookingService.deleteBooking(1L);

        assertThat(result).isEqualTo(bookingDTO1);
        verify(bookingRepository, times(1)).delete(booking1);
    }

    @Test
    void getMatchBookingsByUserId_ShouldReturnList() {
        List<Booking> bookings = Arrays.asList(booking1);
        List<BookingDTO> dtos = Arrays.asList(bookingDTO1);

        when(bookingRepository.findByUserIdAndType(2L, BookingType.MATCH)).thenReturn(bookings);
        when(mapper.toDTOs(bookings)).thenReturn(dtos);

        Collection<BookingDTO> result = bookingService.getMatchBookingsByUserId(2L);

        assertThat(result).hasSize(1);
    }

    @Test
    void getTrainingBookingsByUserId_ShouldReturnList() {
        List<Booking> bookings = Arrays.asList(booking1);
        List<BookingDTO> dtos = Arrays.asList(bookingDTO1);

        when(bookingRepository.findByUserIdAndType(2L, BookingType.TRAINING)).thenReturn(bookings);
        when(mapper.toDTOs(bookings)).thenReturn(dtos);

        Collection<BookingDTO> result = bookingService.getTrainingBookingsByUserId(2L);

        assertThat(result).hasSize(1);
    }

    @Test
    void autoCompleteFinishedBookings_ShouldCompleteAndProcessUsage() {
        User client = new User();
        client.setId(2L);
        booking1.setUser(client);
        booking1.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findFinishedPendingBookings(any(), any()))
                .thenReturn(List.of(booking1));

        bookingService.autoCompleteFinishedBookings();

        assertThat(booking1.getStatus()).isEqualTo(BookingStatus.COMPLETED);
        verify(userService, times(1)).processRacketUsageForUser(2L);
        verify(bookingRepository, times(1)).saveAll(anyList());
    }

    @Test
    void createBooking_WhenCoachPriceIsNull_ShouldDefaultToZero() {
        User coach = new User();
        coach.setId(3L);
        coach.setRole(UserRole.COACH);
        coach.setSessionPrice(null);

        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(2));
        when(bookingDTO1.courtId()).thenReturn(null);
        when(bookingDTO1.coachId()).thenReturn(3L);
        when(bookingDTO1.startTime()).thenReturn(LocalTime.of(10, 0));
        when(bookingDTO1.endTime()).thenReturn(LocalTime.of(12, 0));
        when(bookingDTO1.userId()).thenReturn(2L);

        when(mapper.toDomain(bookingDTO1)).thenReturn(booking1);

        when(userRepository.findById(3L)).thenReturn(Optional.of(coach));
        User student = new User();
        student.setId(2L);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        when(bookingRepository.existsOverlappingCoachBooking(anyLong(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking1);
        when(mapper.toDTO(booking1)).thenReturn(bookingDTO1);

        bookingService.createBooking(bookingDTO1);

        assertThat(booking1.getBookingPrice()).isEqualTo(0.0);
    }
}
