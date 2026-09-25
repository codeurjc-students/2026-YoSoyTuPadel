package es.urjc.code.yosoytupadel.backend.integration.service;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.entities.*;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
class BookingServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BookingService bookingService;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private UserRepository userRepository;

    private Booking savedBooking;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        courtRepository.deleteAll();
        userRepository.deleteAll();

        Court court = new Court("Pista Central", 8.0, CourtType.INDOOR, SurfaceType.GLASS);
        court.setIsAvailable(true);
        court = courtRepository.save(court);

        User user = new User();
        user.setName("Test Student");
        user.setEmail("student@test.com");
        user.setEncodedPassword("pass");
        user.setRole(UserRole.USER);
        user = userRepository.save(user);

        Booking booking = new Booking();
        booking.setCourt(court);
        booking.setUser(user);
        booking.setBookingDate(LocalDate.now().plusDays(2));
        booking.setStartTime(LocalTime.of(18, 0));
        booking.setEndTime(LocalTime.of(19, 30));
        booking.setStatus(BookingStatus.PENDING);
        booking.setType(BookingType.MATCH);
        booking.setBookingPrice(8.0);

        savedBooking = bookingRepository.save(booking);
    }

    @Test
    void getAllBookings_ShouldReturnAllFromDatabase() {
        Collection<BookingDTO> result = bookingService.getAllBookings();
        assertThat(result).hasSize(1);
    }

    @Test
    void cancelBooking_ShouldUpdateDatabaseStatusToCancelled() {
        // Ejecutamos la cancelación a través del servicio
        bookingService.cancelBooking(savedBooking.getId());

        // Comprobamos directamente en la base de datos
        Booking cancelledBooking = bookingRepository.findById(savedBooking.getId()).orElseThrow();

        assertThat(cancelledBooking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }
}