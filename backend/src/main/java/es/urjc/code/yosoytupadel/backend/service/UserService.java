package es.urjc.code.yosoytupadel.backend.service;

import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.dto.CoachCreateDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserMapper;
import es.urjc.code.yosoytupadel.backend.dto.UserUpdateDTO;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import org.hibernate.Hibernate;
import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.rowset.serial.SerialBlob;
import jakarta.validation.Valid;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.Collection;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RacketRepository racketRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private BookingRepository bookingRepository;

    public User getUserEntityById(long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }


    @Transactional(readOnly = true)
    public Collection<UserDTO> getAllUsers() {
        return userMapper.toDTOs(userRepository.findAll());
    }

    @Transactional(readOnly = true)
    public Optional<UserDTO> getUserById(long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Hibernate.initialize(user.get().getRacketHistory());
        return Optional.of(userMapper.toDTO(user.get()));
    }

    @Transactional
    public UserDTO createUser(UserDTO userDTO) {
        if (existsByEmail(userDTO.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }

        User user = userMapper.toDomain(userDTO);
        user.setEncodedPassword(passwordEncoder.encode(userDTO.password()));
        user.setRole(UserRole.USER);
        user.setRacket(null);

        if (user.getSkillLevel() == null || user.getSkillLevel() == 0.0) {
            user.setSkillLevel(1.0);
        }

        try {
            ClassPathResource imgFileDefault = new ClassPathResource("static/images/emptyImage.png");
            try (InputStream inputStream = imgFileDefault.getInputStream()) {
                byte[] imageBytes = inputStream.readAllBytes();
                Blob imageBlob = new SerialBlob(imageBytes);
                user.setProfilePicture(imageBlob);
            }
        } catch (IOException | SQLException e) {
            throw new RuntimeException("Error setting default image", e);
        }

        User savedUser = userRepository.save(user);
        return userMapper.toDTO(savedUser);
    }

    @Transactional
    public UserDTO createCoach(@Valid CoachCreateDTO dto, MultipartFile image) {
        String email = dto.email().trim();
        if (existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }

        User coach = new User();
        coach.setName(dto.name().trim());
        coach.setNickname(null);
        coach.setEmail(email);
        coach.setEncodedPassword(passwordEncoder.encode(dto.password()));
        coach.setRole(UserRole.COACH);
        coach.setSkillLevel(dto.skillLevel());
        coach.setSessionPrice(dto.sessionPrice());
        coach.setRacket(null);

        try {
            if (image != null && !image.isEmpty()) {
                coach.setProfilePicture(BlobProxy.generateProxy(image.getInputStream(), image.getSize()));
            } else {
                ClassPathResource defaultImage = new ClassPathResource("static/images/emptyImage.png");
                try (InputStream inputStream = defaultImage.getInputStream()) {
                    coach.setProfilePicture(new SerialBlob(inputStream.readAllBytes()));
                }
            }
        } catch (IOException | SQLException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not store coach profile image",
                    exception
            );
        }

        return userMapper.toDTO(userRepository.save(coach));
    }


    @Transactional
    public UserUpdateDTO updateUser(Long id, UserUpdateDTO updateDTO) {
        User existingUser = getUserEntityById(id);

        if (updateDTO.email() != null && !updateDTO.email().isBlank()) {
            Optional<User> existingUserByEmail = userRepository.findByEmail(updateDTO.email().trim());
            if (existingUserByEmail.isPresent() && !existingUserByEmail.get().getId().equals(existingUser.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use.");
            }
        }

        userMapper.updateUserFromDTO(updateDTO, existingUser);
        if (updateDTO.skillLevel() != null
                && existingUser.getRole() == UserRole.COACH
                && isAuthenticatedAdmin()) {
            existingUser.setSkillLevel(updateDTO.skillLevel());
        }
        if (updateDTO.password() != null && !updateDTO.password().trim().isBlank()) {
            existingUser.setEncodedPassword(passwordEncoder.encode(updateDTO.password().trim()));
        }
        User savedUser = userRepository.save(existingUser);

        return userMapper.toUserUpdateDTO(savedUser);
    }

    private boolean isAuthenticatedAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    @Transactional
    public UserDTO updateSkillLevel(long studentId, Double change) {
        User student = getUserEntityById(studentId);

        if (student.getRole() == UserRole.COACH) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Coach certification level can only be changed by an administrator."
            );
        }

        double newLevel = student.getSkillLevel() + change;
        if (newLevel > 5.0) newLevel = 5.0;
        if (newLevel < 1.0) newLevel = 1.0;

        student.setSkillLevel(newLevel);
        return userMapper.toDTO(userRepository.save(student));
    }

    @Transactional
    public UserDTO deleteUser(long id) {
        UserDTO currentUser = getAuthenticatedUserDto()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado"));

        boolean isCurrentUserAdmin = UserRole.ADMIN.equals(currentUser.role());


        if (isCurrentUserAdmin && currentUser.id() == id) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Un administrador no puede eliminar su propia cuenta.");
        }

        if (!isCurrentUserAdmin && currentUser.id() != id) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para eliminar la cuenta de otro usuario.");
        }

        User user = getUserEntityById(id);
        userRepository.deleteById(id);
        return userMapper.toDTO(user);
    }

    @Transactional
    public UserDTO rentRacket(long userId, long racketId) {
        User user = getUserEntityById(userId);

        if (user.getRacket() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already have a rented racket.");
        }

        Racket racket = racketRepository.findById(racketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "The racket does not exists."));

        if (racket.getStock() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Out of stock for this racket.");
        }

        racket.setStock(racket.getStock() - 1);
        racketRepository.save(racket);

        user.setRacket(racket);
        user.setRacketUsages(0);
        return userMapper.toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO returnRacket(long userId) {
        User user = getUserEntityById(userId);
        Racket racket = user.getRacket();

        if (racket != null) {
            user.addRacketToHistory(racket);
            racket.setStock(racket.getStock() + 1);
            racketRepository.save(racket);

            user.setRacket(null);
            user.setRacketUsages(0);
            userRepository.save(user);
        }

        return userMapper.toDTO(user);
    }

    @Transactional
    public void processRacketUsageForUser(long userId) {
        User user = getUserEntityById(userId);

        if (user.getRacket() != null) {
            user.setRacketUsages(user.getRacketUsages() + 1);

            // We forced a return after the third use
            if (user.getRacketUsages() >= 3) {
                Racket racket = user.getRacket();
                user.addRacketToHistory(racket);
                racket.setStock(racket.getStock() + 1);
                racketRepository.save(racket);

                user.setRacket(null);
                user.setRacketUsages(0);
            }
            userRepository.save(user);
        }
    }

    public InputStreamResource getUserImage(long id) throws SQLException {
        User user = getUserEntityById(id);
        if (user.getProfilePicture() != null) {
            return new InputStreamResource(user.getProfilePicture().getBinaryStream());
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User image not found");
    }

    public void replaceUserImage(long id, InputStream inputStream, long size) {
        User user = getUserEntityById(id);
        user.setProfilePicture(BlobProxy.generateProxy(inputStream, size));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUserImage(long id) {
        try {
            User user = getUserEntityById(id);
            ClassPathResource defaultImage = new ClassPathResource("static/images/emptyImage.png");
            try (InputStream inputStream = defaultImage.getInputStream()) {
                user.setProfilePicture(new SerialBlob(inputStream.readAllBytes()));
            }
            userRepository.save(user);
        } catch (IOException | SQLException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error deleting user image",
                    e
            );
        }
    }

    @Transactional(readOnly = true)
    public Optional<UserDTO> getAuthenticatedUserDto() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findWithRacketHistoryByEmail(userDetails.getUsername())
                    .map(userMapper::toDTO);
        }

        return Optional.empty();
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }



    public Collection<CoachDTO> getAllCoachs() {
        return userRepository.findByRole(UserRole.COACH).stream()
                .map(userMapper::toCoachDTO)
                .toList();
    }

    public Page<CoachDTO> getCoachs(Pageable pageable) {
        return userRepository.findAllByRole(UserRole.COACH, pageable)
                .map(userMapper::toCoachDTO);
    }

    public Optional<CoachDTO> getCoachById(long id) {
        return userRepository.findByIdAndRole(id, UserRole.COACH)
                .map(userMapper::toCoachDTO);
    }

    public boolean isMe(long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .map(user -> user.getId().equals(id))
                    .orElse(false);
        }
        return false;
    }

    public boolean isMine(long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails userDetails) {
            return bookingRepository.findById(id)
                    .flatMap(booking -> userRepository.findByEmail(userDetails.getUsername())
                            .map(user -> user.getId().equals(booking.getUser().getId())))
                    .orElse(false);
        }
        return false;
    }

    public boolean isCoach(long id) {
        return userRepository.findById(id)
                .map(user -> user.getRole().equals(UserRole.COACH))
                .orElse(false);
    }
}