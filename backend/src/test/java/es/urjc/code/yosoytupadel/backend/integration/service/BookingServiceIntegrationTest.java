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
import es.urjc.code.yosoytupadel.backend.dto.CoachBookingDTO;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

        Court court = new Court("Pista Central", 8.0, CourtType.INDOOR, SurfaceType.GLASS, null, null);
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
        Court testCourt = new Court("Pista Concurrencia", 10.0, CourtType.INDOOR, SurfaceType.GLASS, null, null);
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

    @Test
    void evaluateTraining_ShouldPersistScoreUpdateStudentLevelAndPreventReevaluation() {
        User student = new User();
        student.setName("Progression Student");
        student.setEmail("prog@test.com");
        student.setEncodedPassword("pass");
        student.setRole(UserRole.USER);
        student.setBaseLevel(1.0);
        student.setSkillLevel(1.0);
        student = userRepository.save(student);

        User coach = new User();
        coach.setName("Coach Test");
        coach.setEmail("coach@test.com");
        coach.setEncodedPassword("pass");
        coach.setRole(UserRole.COACH);
        coach.setSkillLevel(4.0);
        coach = userRepository.save(coach);

        Booking training = new Booking(
                LocalDate.now().minusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                35.0,
                student,
                coach
        );
        training.setStatus(BookingStatus.COMPLETED);
        training = bookingRepository.save(training);

        // When: Coach evaluates student with score 10 (1.0 + 0.40 = 1.40)
        CoachBookingDTO result = bookingService.evaluateTraining(training.getId(), 10);

        // Then: DTO and persisted entities reflect the new score and skill level
        assertThat(result.booking().score()).isEqualTo("10");
        assertThat(result.client().skillLevel()).isEqualTo(1.40);

        Booking persistedBooking = bookingRepository.findById(training.getId()).orElseThrow();
        User persistedStudent = userRepository.findById(student.getId()).orElseThrow();
        assertThat(persistedBooking.getScore()).isEqualTo("10");
        assertThat(persistedStudent.getSkillLevel()).isEqualTo(1.40);

        // Progression curve includes the evaluated session
        var progression = bookingService.getUserProgression(student.getId());
        assertThat(progression.get(progression.size() - 1).currentLevel()).isEqualTo(1.40);

        // Re-evaluating the same booking throws 409 Conflict
        long trainingId = training.getId();
        assertThatThrownBy(() -> bookingService.evaluateTraining(trainingId, 7))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already been evaluated");
    }
}