package es.urjc.code.yosoytupadel.backend.integration.service;

import es.urjc.code.yosoytupadel.backend.BaseIntegrationTest;
import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
        userRepository.flush();
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

        //We check directly in the database
        User updatedStudent = userRepository.findById(savedStudent.getId()).orElseThrow();
        Racket updatedRacket = racketRepository.findById(savedRacket.getId()).orElseThrow();

        assertThat(updatedStudent.getRacket().getId()).isEqualTo(savedRacket.getId());
        assertThat(updatedRacket.getStock()).isEqualTo(2);
    }

    @Test
    @Transactional
    void returnRacket_ShouldPersistRacketRentalHistory() {
        userService.rentRacket(savedStudent.getId(), savedRacket.getId());

        userService.returnRacket(savedStudent.getId());
        userService.rentRacket(savedStudent.getId(), savedRacket.getId());
        userService.returnRacket(savedStudent.getId());

        User updatedStudent = userRepository.findById(savedStudent.getId()).orElseThrow();
        assertThat(updatedStudent.getRacket()).isNull();
        assertThat(updatedStudent.getRacketHistory())
                .extracting(Racket::getId)
                .containsExactly(savedRacket.getId(), savedRacket.getId());
    }

    @Test
    void createUser_ShouldAssignZeroForFirstTimePlayerAndCalculateLevelForExperiencedPlayer() {
        UserDTO beginnerRequest = new UserDTO(
                null, "Debutante", "debutante01", "debutante@test.com", "Password123",
                null, null, null, 0, List.of(), null, true, null
        );
        UserDTO createdBeginner = userService.createUser(beginnerRequest);
        assertThat(createdBeginner.skillLevel()).isEqualTo(0.0);

        UserDTO experiencedRequest = new UserDTO(
                null, "Jugador Medio", "medio01", "medio@test.com", "Password123",
                null, null, null, 0, List.of(), null, false, List.of(2, 3, 2, 1, 2)
        );
        UserDTO createdExperienced = userService.createUser(experiencedRequest);
        assertThat(createdExperienced.skillLevel()).isEqualTo(2.25);
    }

    @Test
    void validateRegistrationAvailability_ShouldThrowConflictWhenEmailOrNicknameAlreadyExists() {
        savedStudent.setNickname("ana_padel");
        userRepository.save(savedStudent);

        assertThatThrownBy(() -> userService.validateRegistrationAvailability("ana@test.com", "otro_nick"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        assertThatThrownBy(() -> userService.validateRegistrationAvailability("nuevo@test.com", "ana_padel"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }
}