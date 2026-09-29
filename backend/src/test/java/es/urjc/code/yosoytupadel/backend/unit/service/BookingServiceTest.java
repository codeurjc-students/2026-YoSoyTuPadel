package es.urjc.code.yosoytupadel.backend.unit.service;

import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.BookingMapper;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
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
import static org.mockito.ArgumentMatchers.any;

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

    @Test
    void createBooking_WhenUserNotFound_ShouldThrowNotFound() {
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(2));

        when(bookingDTO1.startTime()).thenReturn(LocalTime.of(10, 0));
        when(bookingDTO1.endTime()).thenReturn(LocalTime.of(11, 0));

        when(bookingDTO1.coachId()).thenReturn(null);
        when(bookingDTO1.courtId()).thenReturn(1L);
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));
        when(bookingRepository.existsOverlappingBooking(eq(1L), any(), any(), any())).thenReturn(false);

        when(bookingDTO1.userId()).thenReturn(99L);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void createBooking_WhenCourtNotFound_ShouldThrowNotFound() {
        when(bookingDTO1.bookingDate()).thenReturn(LocalDate.now().plusDays(2));

        when(bookingDTO1.coachId()).thenReturn(null);
        when(bookingDTO1.courtId()).thenReturn(99L);

        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.createBooking(bookingDTO1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Court not found");
    }

    @Test
    void getAllBookingsByUserIdMapsRepositoryResults() {
        List<Booking> bookings = List.of(booking1);
        when(bookingRepository.findByUserId(2L)).thenReturn(bookings);
        when(mapper.toDTOs(bookings)).thenReturn(List.of(bookingDTO1));

        assertThat(bookingService.getAllBookingsByUserId(2L)).containsExactly(bookingDTO1);

        verify(bookingRepository).findByUserId(2L);
        verify(mapper).toDTOs(bookings);
    }

    @Test
    void getBookingByIdReturnsMappedBookingWhenFound() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));
        when(mapper.toDTO(booking1)).thenReturn(bookingDTO1);

        assertThat(bookingService.getBookingById(1L)).contains(bookingDTO1);
    }

    @Test
    void getBookingByIdReturnsEmptyWhenMissing() {
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThat(bookingService.getBookingById(99L)).isEmpty();
        verify(mapper, never()).toDTO(any(Booking.class));
    }

    @Test
    void createBookingRejectsNullDateAndDateBeyondTwoWeeks() {
        BookingDTO noDate = mock(BookingDTO.class);
        when(noDate.bookingDate()).thenReturn(null);
        assertThatThrownBy(() -> bookingService.createBooking(noDate))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("past");

        BookingDTO tooFarAhead = mock(BookingDTO.class);
        when(tooFarAhead.bookingDate()).thenReturn(LocalDate.now().plusDays(15));
        assertThatThrownBy(() -> bookingService.createBooking(tooFarAhead))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("14 days");

        verifyNoInteractions(courtRepository, userRepository);
    }

    @Test
    void createBookingRejectsBothOrNeitherCourtAndCoach() {
        BookingDTO both = mock(BookingDTO.class);
        when(both.bookingDate()).thenReturn(LocalDate.now());
        when(both.courtId()).thenReturn(1L);
        when(both.coachId()).thenReturn(3L);
        assertThatThrownBy(() -> bookingService.createBooking(both))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("both a court and a coach");

        BookingDTO neither = mock(BookingDTO.class);
        when(neither.bookingDate()).thenReturn(LocalDate.now());
        when(neither.courtId()).thenReturn(null);
        when(neither.coachId()).thenReturn(null);
        assertThatThrownBy(() -> bookingService.createBooking(neither))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("must have either");

        verifyNoInteractions(courtRepository, userRepository);
    }

    @Test
    void createBookingRejectsCourtClosedForMaintenance() {
        court.setIsAvailable(false);
        BookingDTO dto = courtBookingDTO(1L, 2L, null);
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));

        assertThatThrownBy(() -> bookingService.createBooking(dto))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("closed for maintenance");

        verifyNoInteractions(userRepository);
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void createBookingRejectsCoachNotFound() {
        BookingDTO dto = coachBookingDTO(3L, 2L, null);
        when(userRepository.findById(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.createBooking(dto))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Coach not found");

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void createCourtBookingSetsMatchStatusAndCourtPrice() {
        User student = new User();
        student.setId(2L);
        BookingDTO dto = courtBookingDTO(1L, 2L, null);
        Booking created = new Booking();
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));
        when(bookingRepository.existsOverlappingBooking(eq(1L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(mapper.toDomain(dto)).thenReturn(created);
        when(bookingRepository.save(created)).thenReturn(created);
        when(mapper.toDTO(created)).thenReturn(bookingDTO1);

        assertThat(bookingService.createBooking(dto)).isEqualTo(bookingDTO1);

        assertThat(created.getCourt()).isSameAs(court);
        assertThat(created.getUser()).isSameAs(student);
        assertThat(created.getCoach()).isNull();
        assertThat(created.getType()).isEqualTo(BookingType.MATCH);
        assertThat(created.getStatus()).isEqualTo(BookingStatus.PENDING);
        assertThat(created.getBookingPrice()).isEqualTo(court.getCourtPrice());
    }

    @Test
    void createTrainingBookingUsesAuthenticatedUserAndCoachPrice() {
        User coach = new User();
        coach.setId(3L);
        coach.setSessionPrice(35.0);
        User student = new User();
        student.setId(2L);
        UserDTO authenticatedUser = mock(UserDTO.class);
        when(authenticatedUser.id()).thenReturn(2L);
        BookingDTO dto = coachBookingDTO(3L, null, null);
        Booking created = new Booking();
        when(userRepository.findById(3L)).thenReturn(Optional.of(coach));
        when(bookingRepository.existsOverlappingCoachBooking(
                eq(3L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.of(authenticatedUser));
        when(userService.getUserEntityById(2L)).thenReturn(student);
        when(mapper.toDomain(dto)).thenReturn(created);
        when(bookingRepository.save(created)).thenReturn(created);
        when(mapper.toDTO(created)).thenReturn(bookingDTO1);

        bookingService.createBooking(dto);

        assertThat(created.getCourt()).isNull();
        assertThat(created.getCoach()).isSameAs(coach);
        assertThat(created.getUser()).isSameAs(student);
        assertThat(created.getType()).isEqualTo(BookingType.TRAINING);
        assertThat(created.getStatus()).isEqualTo(BookingStatus.PENDING);
        assertThat(created.getBookingPrice()).isEqualTo(35.0);
    }

    @Test
    void createTrainingBookingUsesZeroPriceWhenCoachHasNoSessionPrice() {
        User coach = new User();
        coach.setId(3L);
        User student = new User();
        student.setId(2L);
        BookingDTO dto = coachBookingDTO(3L, 2L, null);
        Booking created = new Booking();
        when(userRepository.findById(3L)).thenReturn(Optional.of(coach));
        when(bookingRepository.existsOverlappingCoachBooking(
                eq(3L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(mapper.toDomain(dto)).thenReturn(created);
        when(bookingRepository.save(created)).thenReturn(created);
        when(mapper.toDTO(created)).thenReturn(bookingDTO1);

        bookingService.createBooking(dto);

        assertThat(created.getBookingPrice()).isEqualTo(0.0);
    }

    @Test
    void createBookingRejectsMissingAuthenticatedUser() {
        User coach = new User();
        coach.setId(3L);
        BookingDTO dto = coachBookingDTO(3L, null, null);
        when(userRepository.findById(3L)).thenReturn(Optional.of(coach));
        when(bookingRepository.existsOverlappingCoachBooking(
                eq(3L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.createBooking(dto))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not authenticated");
    }

    @Test
    void createBookingPreservesExplicitPrice() {
        User student = new User();
        student.setId(2L);
        BookingDTO dto = courtBookingDTO(1L, 2L, 50.0);
        Booking created = new Booking();
        created.setBookingPrice(dto.bookingPrice());
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));
        when(bookingRepository.existsOverlappingBooking(eq(1L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(mapper.toDomain(dto)).thenReturn(created);
        when(bookingRepository.save(created)).thenReturn(created);
        when(mapper.toDTO(created)).thenReturn(bookingDTO1);

        bookingService.createBooking(dto);

        assertThat(created.getBookingPrice()).isEqualTo(50.0);
    }

    @Test
    void cancelBookingRejectsMissingBookingAndAlreadyCancelledBooking() {
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> bookingService.cancelBooking(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Booking not found");

        booking1.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));
        assertThatThrownBy(() -> bookingService.cancelBooking(1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already been cancelled");

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void cancelBookingRejectsCompletedBooking() {
        booking1.setStatus(BookingStatus.COMPLETED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));

        assertThatThrownBy(() -> bookingService.cancelBooking(1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already finished");

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void deleteBookingDeletesAndReturnsMappedBooking() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking1));
        when(mapper.toDTO(booking1)).thenReturn(bookingDTO1);

        assertThat(bookingService.deleteBooking(1L)).isEqualTo(bookingDTO1);

        verify(bookingRepository).delete(booking1);
    }

    @Test
    void deleteBookingRejectsMissingBooking() {
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.deleteBooking(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Booking not found");

        verify(bookingRepository, never()).delete(any(Booking.class));
    }

    @Test
    void matchAndTrainingBookingsUseTheirCorrespondingTypes() {
        List<Booking> bookings = List.of(booking1);
        when(bookingRepository.findByUserIdAndType(2L, BookingType.MATCH)).thenReturn(bookings);
        when(bookingRepository.findByUserIdAndType(2L, BookingType.TRAINING)).thenReturn(bookings);
        when(mapper.toDTOs(bookings)).thenReturn(List.of(bookingDTO1));

        assertThat(bookingService.getMatchBookingsByUserId(2L)).containsExactly(bookingDTO1);
        assertThat(bookingService.getTrainingBookingsByUserId(2L)).containsExactly(bookingDTO1);

        verify(bookingRepository).findByUserIdAndType(2L, BookingType.MATCH);
        verify(bookingRepository).findByUserIdAndType(2L, BookingType.TRAINING);
    }

    @Test
    void autoCompleteFinishedBookingsDoesNotSaveWhenThereAreNoFinishedBookings() {
        when(bookingRepository.findFinishedPendingBookings(any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(List.of());

        bookingService.autoCompleteFinishedBookings();

        verify(bookingRepository, never()).saveAll(any());
        verifyNoInteractions(userService);
    }

    @Test
    void autoCompleteFinishedBookingsCompletesBookingsAndProcessesRacketUsage() {
        User student = new User();
        student.setId(2L);
        booking1.setUser(student);
        List<Booking> finished = List.of(booking1);
        when(bookingRepository.findFinishedPendingBookings(any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(finished);

        bookingService.autoCompleteFinishedBookings();

        assertThat(booking1.getStatus()).isEqualTo(BookingStatus.COMPLETED);
        verify(userService).processRacketUsageForUser(2L);
        verify(bookingRepository).saveAll(finished);
    }

    private BookingDTO courtBookingDTO(Long courtId, Long userId, Double price) {
        return new BookingDTO(null, LocalDate.now().plusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0),
                price, null, null, null, userId, courtId, null);
    }

    private BookingDTO coachBookingDTO(Long coachId, Long userId, Double price) {
        return new BookingDTO(null, LocalDate.now().plusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0),
                price, null, null, null, userId, null, coachId);
    }
}
