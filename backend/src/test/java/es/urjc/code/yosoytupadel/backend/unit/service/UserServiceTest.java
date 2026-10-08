package es.urjc.code.yosoytupadel.backend.unit.service;

import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserUpdateDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserMapper;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

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
    private BookingRepository bookingRepository;

    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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

        coachDTO = new CoachDTO(1L, "Entrenador Pepe", 3, 35.0);
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

        // We verified that the stock was deducted and the usage was reset
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
    void returnRacket_ShouldPersistReturnedRacketInHistory() {
        student.setRacket(racket);
        student.setRacketUsages(2);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(racketRepository.save(racket)).thenReturn(racket);
        when(userRepository.save(student)).thenReturn(student);
        when(userMapper.toDTO(student)).thenReturn(studentDTO);

        UserDTO result = userService.returnRacket(2L);

        assertThat(result).isEqualTo(studentDTO);
        assertThat(student.getRacketHistory()).containsExactly(racket);
        assertThat(student.getRacket()).isNull();
        assertThat(student.getRacketUsages()).isZero();
        assertThat(racket.getStock()).isEqualTo(6);
        verify(userRepository).save(student);
    }

    @Test
    void processThirdRacketUsage_ShouldAddReturnedRacketToHistory() {
        student.setRacket(racket);
        student.setRacketUsages(2);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(racketRepository.save(racket)).thenReturn(racket);
        when(userRepository.save(student)).thenReturn(student);

        userService.processRacketUsageForUser(2L);

        assertThat(student.getRacketHistory()).containsExactly(racket);
        assertThat(student.getRacket()).isNull();
        assertThat(student.getRacketUsages()).isZero();
        assertThat(racket.getStock()).isEqualTo(6);
    }

    @Test
    void getUserEntityById_WhenUserDoesNotExist_ShouldThrowNotFoundException() {
        // Given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> userService.getUserEntityById(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void getUserById_WhenUserDoesNotExist_ShouldReturnEmpty() {
        // Given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // When
        Optional<UserDTO> result = userService.getUserById(99L);

        // Then
        assertThat(result).isEmpty();
        verify(userMapper, never()).toDTO(any(User.class));
    }

    @Test
    void rentRacket_WhenUserAlreadyHasRacket_ShouldThrowBadRequest() {
        // Given
        student.setRacket(racket);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        // When / Then
        assertThatThrownBy(() -> userService.rentRacket(2L, 1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already have");
        verify(racketRepository, never()).findById(anyLong());
        verify(userRepository, never()).save(any());
    }

    @Test
    void rentRacket_WhenRacketDoesNotExist_ShouldThrowBadRequest() {
        // Given
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(racketRepository.findById(99L)).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> userService.rentRacket(2L, 99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("does not exists");
        verify(racketRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void returnRacket_WhenUserHasNoRacket_ShouldOnlyReturnMappedUser() {
        // Given
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(userMapper.toDTO(student)).thenReturn(studentDTO);

        // When
        UserDTO result = userService.returnRacket(2L);

        // Then
        assertThat(result).isEqualTo(studentDTO);
        verify(racketRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void processRacketUsage_WhenUsageDoesNotReachLimit_ShouldSaveUserOnly() {
        // Given
        student.setRacket(racket);
        student.setRacketUsages(0);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        // When
        userService.processRacketUsageForUser(2L);

        // Then
        assertThat(student.getRacketUsages()).isEqualTo(1);
        assertThat(student.getRacket()).isEqualTo(racket);
        verify(userRepository).save(student);
        verify(racketRepository, never()).save(any());
    }

    @Test
    void updateSkillLevel_ShouldClampLevelToUpperAndLowerBounds() {
        // Given
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(userRepository.save(student)).thenReturn(student);
        when(userMapper.toDTO(student)).thenReturn(studentDTO);

        // When
        userService.updateSkillLevel(2L, 10.0);
        assertThat(student.getSkillLevel()).isEqualTo(5.0);
        userService.updateSkillLevel(2L, -10.0);

        // Then
        assertThat(student.getSkillLevel()).isEqualTo(1.0);
        verify(userRepository, times(2)).save(student);
    }

    @Test
    void isCoach_WhenUserDoesNotExist_ShouldReturnFalse() {
        // Given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // When / Then
        assertThat(userService.isCoach(99L)).isFalse();
    }

    @Test
    void getAuthenticatedUserDto_WhenAuthenticationIsMissing_ShouldReturnEmpty() {
        // Given
        SecurityContextHolder.clearContext();

        // When
        Optional<UserDTO> result = userService.getAuthenticatedUserDto();

        // Then
        assertThat(result).isEmpty();
        verify(userRepository, never()).findWithRacketHistoryByEmail(anyString());
    }

    @Test
    void createUser_WhenEmailIsAlreadyUsed_ShouldThrowConflict() {
        // Given
        when(studentDTO.email()).thenReturn("used@example.com");
        when(userRepository.existsByEmail("used@example.com")).thenReturn(true);

        // When / Then
        assertThatThrownBy(() -> userService.createUser(studentDTO))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already in use");
        verify(userMapper, never()).toDomain(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_WhenSkillLevelIsMissing_ShouldUseDefaultLevel() {
        // Given
        User newUser = new User();
        when(studentDTO.email()).thenReturn("new@example.com");
        when(studentDTO.password()).thenReturn("password");
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userMapper.toDomain(studentDTO)).thenReturn(newUser);
        when(passwordEncoder.encode("password")).thenReturn("encoded");
        when(userRepository.save(newUser)).thenReturn(newUser);
        when(userMapper.toDTO(newUser)).thenReturn(studentDTO);

        // When
        UserDTO result = userService.createUser(studentDTO);

        // Then
        assertThat(result).isEqualTo(studentDTO);
        assertThat(newUser.getSkillLevel()).isEqualTo(1.0);
        assertThat(newUser.getRole()).isEqualTo(UserRole.USER);
        assertThat(newUser.getEncodedPassword()).isEqualTo("encoded");
        verify(userRepository).save(newUser);
    }

    @Test
    void updateUser_WhenEmailBelongsToAnotherUser_ShouldThrowConflict() {
        // Given
        User otherUser = new User();
        otherUser.setId(9L);
        UserUpdateDTO updateDTO = mock(UserUpdateDTO.class);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(updateDTO.email()).thenReturn("other@example.com");
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));

        // When / Then
        assertThatThrownBy(() -> userService.updateUser(2L, updateDTO))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already in use");
        verify(userMapper, never()).updateUserFromDTO(any(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void getUserImage_WhenImageIsMissing_ShouldThrowNotFound() {
        // Given
        student.setProfilePicture(null);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        // When / Then
        assertThatThrownBy(() -> userService.getUserImage(2L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User image not found");
    }

    @Test
    void deleteUserImage_WhenImageIsMissing_ShouldThrowNotFound() {
        // Given
        student.setProfilePicture(null);
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));

        // When / Then
        assertThatThrownBy(() -> userService.deleteUserImage(2L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User image not found");
        verify(userRepository, never()).save(any());
    }

    @Test
    void isMe_WhenAuthenticatedUserHasDifferentId_ShouldReturnFalse() {
        // Given
        UserDetails details = mock(UserDetails.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(details);
        when(details.getUsername()).thenReturn("student@example.com");
        when(userRepository.findWithRacketHistoryByEmail("student@example.com"))
                .thenReturn(Optional.of(student));
        when(userMapper.toDTO(student)).thenReturn(studentDTO);
        when(studentDTO.id()).thenReturn(2L);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // When / Then
        assertThat(userService.isMe(1L)).isFalse();
    }

    @Test
    void isCoach_WhenUserHasCoachRole_ShouldReturnTrue() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(coach));

        // When / Then
        assertThat(userService.isCoach(1L)).isTrue();
    }
}