package es.urjc.code.yosoytupadel.backend.integration.service;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import es.urjc.code.yosoytupadel.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Collection;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
class UserServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RacketRepository racketRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private User savedStudent;
    private Racket savedRacket;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        userRepository.deleteAll();
        racketRepository.deleteAll();

        User coach = new User();
        coach.setName("Coach Carlos");
        coach.setEmail("carlos@coach.com");
        coach.setEncodedPassword("pass");
        coach.setRole(UserRole.COACH);
        coach.setSessionPrice(30.0);
        userRepository.save(coach);

        User student = new User();
        student.setName("Estudiante Ana");
        student.setEmail("ana@test.com");
        student.setEncodedPassword("pass");
        student.setRole(UserRole.USER);
        savedStudent = userRepository.save(student);

        Racket racket = new Racket("Bullpadel", "Vertex", "Potencia", 20.0);
        racket.setStock(3);
        savedRacket = racketRepository.save(racket);
    }

    @Test
    void getAllCoachs_ShouldReturnOnlyCoaches() {
        Collection<CoachDTO> coaches = userService.getAllCoachs();

        assertThat(coaches).hasSize(1);
        assertThat(coaches.iterator().next().name()).isEqualTo("Coach Carlos");
    }

    @Test
    void rentRacket_ShouldUpdateDatabaseEntities() {

        userService.rentRacket(savedStudent.getId(), savedRacket.getId());

        // Comprobamos directamente en la base de datos
        User updatedStudent = userRepository.findById(savedStudent.getId()).orElseThrow();
        Racket updatedRacket = racketRepository.findById(savedRacket.getId()).orElseThrow();

        assertThat(updatedStudent.getRacket().getId()).isEqualTo(savedRacket.getId());
        assertThat(updatedRacket.getStock()).isEqualTo(2);
    }
}