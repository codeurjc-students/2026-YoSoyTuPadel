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

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import org.springframework.web.server.ResponseStatusException;

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
        // We carry out the cancellation through the service.
        bookingService.cancelBooking(savedBooking.getId());

        //We check directly in the database.
        Booking cancelledBooking = bookingRepository.findById(savedBooking.getId()).orElseThrow();

        assertThat(cancelledBooking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    void createBooking_ConcurrentRequests_OnlyOneSucceeds() throws InterruptedException {
        // Given: Create a court and two separate users in the containerized database
        Court testCourt = new Court("Pista Concurrencia", 10.0, CourtType.INDOOR, SurfaceType.GLASS);
        testCourt.setIsAvailable(true);
        testCourt = courtRepository.save(testCourt);

        User user1 = new User();
        user1.setName("User One");
        user1.setEmail("user1@test.com");
        user1.setEncodedPassword("pass");
        user1.setRole(UserRole.USER);
        user1 = userRepository.save(user1);

        User user2 = new User();
        user2.setName("User Two");
        user2.setEmail("user2@test.com");
        user2.setEncodedPassword("pass");
        user2.setRole(UserRole.USER);
        user2 = userRepository.save(user2);

        LocalDate bookingDate = LocalDate.now().plusDays(5);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(11, 0);

        BookingDTO dto1 = new BookingDTO(
                null, bookingDate, startTime, endTime, null,
                BookingType.MATCH, BookingStatus.PENDING, null, user1.getId(), testCourt.getId(), null
        );

        BookingDTO dto2 = new BookingDTO(
                null, bookingDate, startTime, endTime, null,
                BookingType.MATCH, BookingStatus.PENDING, null, user2.getId(), testCourt.getId(), null
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(1);

        Callable<BookingDTO> task1 = () -> {
            latch.await(); // Wait for release signal
            return bookingService.createBooking(dto1);
        };

        Callable<BookingDTO> task2 = () -> {
            latch.await(); // Wait for release signal
            return bookingService.createBooking(dto2);
        };

        Future<BookingDTO> future1 = executor.submit(task1);
        Future<BookingDTO> future2 = executor.submit(task2);

        // When: Release both threads simultaneously to simulate a race condition
        latch.countDown();

        int successCount = 0;
        List<ExecutionException> exceptions = new ArrayList<>();

        for (Future<BookingDTO> future : List.of(future1, future2)) {
            try {
                future.get();
                successCount++;
            } catch (ExecutionException e) {
                exceptions.add(e);
            }
        }

        executor.shutdown();

        // Then: Exactly one booking succeeds and the other receives a 409 Conflict exception
        assertThat(successCount).isEqualTo(1);
        assertThat(exceptions).hasSize(1);
        assertThat(exceptions.get(0).getCause())
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Este horario ya está reservado actualmente");
    }
}