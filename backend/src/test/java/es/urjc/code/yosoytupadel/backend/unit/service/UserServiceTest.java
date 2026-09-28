package es.urjc.code.yosoytupadel.backend.unit.service;

import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserMapper;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import es.urjc.code.yosoytupadel.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RacketRepository racketRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User coach;
    private User student;
    private Racket racket;
    private CoachDTO coachDTO;
    private UserDTO studentDTO;

    @BeforeEach
    void setUp() {
        coach = new User();
        coach.setId(1L);
        coach.setName("Entrenador Pepe");
        coach.setRole(UserRole.COACH);
        coach.setSkillLevel(9.5);

        student = new User();
        student.setId(2L);
        student.setName("Alumno Juan");
        student.setRole(UserRole.USER);

        racket = new Racket("Head", "Alpha", "Control", 12.0);
        racket.setId(1L);
        racket.setStock(5);

        coachDTO = new CoachDTO(1L, "Entrenador Pepe", 9.5, 35.0);
        studentDTO = mock(UserDTO.class);
    }

    @Test
    void getAllCoachs_ShouldReturnListOfCoachDTOs() {
        List<User> coaches = Arrays.asList(coach);
        when(userRepository.findByRole(UserRole.COACH)).thenReturn(coaches);
        when(userMapper.toCoachDTO(coach)).thenReturn(coachDTO);

        Collection<CoachDTO> result = userService.getAllCoachs();

        assertThat(result).hasSize(1);
        assertThat(result.iterator().next().name()).isEqualTo("Entrenador Pepe");
        verify(userRepository, times(1)).findByRole(UserRole.COACH);
    }

    @Test
    void rentRacket_WhenValid_ShouldAssignRacketAndDecrementStock() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket));
        when(racketRepository.save(racket)).thenReturn(racket);
        when(userRepository.save(student)).thenReturn(student);
        when(userMapper.toDTO(student)).thenReturn(studentDTO);

        UserDTO result = userService.rentRacket(2L, 1L);

        // Verificamos que se descontó el stock y se reseteó el uso
        assertThat(racket.getStock()).isEqualTo(4);
        assertThat(student.getRacket()).isEqualTo(racket);
        assertThat(student.getRacketUsages()).isEqualTo(0);

        assertThat(result).isEqualTo(studentDTO);
    }

    @Test
    void rentRacket_WhenOutOfStock_ShouldThrowConflict() {
        racket.setStock(0);

        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(racketRepository.findById(1L)).thenReturn(Optional.of(racket));

        assertThatThrownBy(() -> userService.rentRacket(2L, 1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Out of stock");

        verify(racketRepository, never()).save(racket);
        verify(userRepository, never()).save(student);
    }

    @Test
    void rentRacket_WhenUserNotFound_ShouldThrowNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.rentRacket(99L, 1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void createUser_WhenEmailExists_ShouldThrowConflict() {
        UserDTO newUserDTO = new UserDTO(null, "Pepe", "Pepe", "pepe@test.com", "pass", UserRole.USER, 1.0, null, 0);
        when(userRepository.existsByEmail(newUserDTO.email())).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(newUserDTO))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email is already in use");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_WhenEmailIsNew_ShouldCreateUserSuccessfully() {
        UserDTO newUserDTO = new UserDTO(null, "Pepe", "Pepe", "pepe@test.com", "pass", UserRole.USER, 1.0, null, 0);
        User mappedUser = new User();
        mappedUser.setEmail("pepe@test.com");

        when(userRepository.existsByEmail(newUserDTO.email())).thenReturn(false);
        when(userMapper.toDomain(newUserDTO)).thenReturn(mappedUser);
        when(passwordEncoder.encode(newUserDTO.password())).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(mappedUser);
        when(userMapper.toDTO(mappedUser)).thenReturn(newUserDTO);

        UserDTO result = userService.createUser(newUserDTO);

        assertThat(result).isNotNull();

        assertThat(mappedUser.getSkillLevel()).isEqualTo(1.0);
        verify(userRepository, times(1)).save(mappedUser);
    }

    @Test
    void updateSkillLevel_ShouldKeepLevelWithinBounds() {
        student.setSkillLevel(4.5);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(userRepository.save(student)).thenReturn(student);
        when(userMapper.toDTO(student)).thenReturn(studentDTO);

        userService.updateSkillLevel(2L, 1.0);
        assertThat(student.getSkillLevel()).isEqualTo(5.0);

        student.setSkillLevel(1.5);
        userService.updateSkillLevel(2L, -2.0);
        assertThat(student.getSkillLevel()).isEqualTo(1.0);
    }

    @Test
    void rentRacket_WhenUserAlreadyHasRacket_ShouldThrowBadRequest() {
        student.setRacket(racket); 
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> userService.rentRacket(2L, 1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You already have a rented racket.");
    }

    @Test
    void processRacketUsageForUser_WhenThirdUsage_ShouldAutoReturnRacket() {
        student.setRacket(racket);
        student.setRacketUsages(2);
        int initialStock = racket.getStock();

        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        userService.processRacketUsageForUser(2L);

        assertThat(student.getRacket()).isNull();
        assertThat(student.getRacketUsages()).isEqualTo(0);
        assertThat(racket.getStock()).isEqualTo(initialStock + 1);
        verify(racketRepository, times(1)).save(racket);
    }

    @Test
    void getUserImage_WhenNoImageExists_ShouldThrowNotFound() {
        student.setProfilePicture(null);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> userService.getUserImage(2L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User image not found");
    }
}