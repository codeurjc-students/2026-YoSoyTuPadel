package es.urjc.code.yosoytupadel.backend.service;

import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserMapper;
import es.urjc.code.yosoytupadel.backend.dto.UserUpdateDTO;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.springframework.beans.factory.annotation.Autowired;
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

import javax.sql.rowset.serial.SerialBlob;
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

    public Collection<UserDTO> getAllUsers() {
        return userMapper.toDTOs(userRepository.findAll());
    }

    public Optional<UserDTO> getUserById(long id) {
        return userRepository.findById(id).map(userMapper::toDTO);
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
    public UserUpdateDTO updateUser(Long id, UserUpdateDTO updateDTO) {
        User existingUser = getUserEntityById(id);

        if (updateDTO.email() != null && !updateDTO.email().isBlank()) {
            Optional<User> existingUserByEmail = userRepository.findByEmail(updateDTO.email().trim());
            if (existingUserByEmail.isPresent() && !existingUserByEmail.get().getId().equals(existingUser.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use.");
            }
        }

        userMapper.updateUserFromDTO(updateDTO, existingUser);
        User savedUser = userRepository.save(existingUser);

        return userMapper.toUserUpdateDTO(savedUser);
    }

    @Transactional
    public UserDTO updateSkillLevel(long studentId, Double change) {
        User student = getUserEntityById(studentId);

        double newLevel = student.getSkillLevel() + change;
        if (newLevel > 5.0) newLevel = 5.0;
        if (newLevel < 1.0) newLevel = 1.0;

        student.setSkillLevel(newLevel);
        return userMapper.toDTO(userRepository.save(student));
    }

    @Transactional
    public UserDTO deleteUser(long id) {
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

            // forzamos la devolución tras el tercer uso
            if (user.getRacketUsages() >= 3) {
                Racket racket = user.getRacket();
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

    public void deleteUserImage(long id) {
        try {
            User user = getUserEntityById(id);
            if (user.getProfilePicture() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User image not found");
            }
            ClassPathResource imgFileDefault = new ClassPathResource("static/images/profile-picture-default.jpg");
            byte[] imageBytesDefault = Files.readAllBytes(imgFileDefault.getFile().toPath());
            Blob imageBlobDefault = new SerialBlob(imageBytesDefault);
            user.setProfilePicture(imageBlobDefault);
            userRepository.save(user);
        } catch (IOException | SQLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error deleting user image");
        }
    }

    public Optional<UserDTO> getAuthenticatedUserDto() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
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

    public boolean isMe(long id) {
        return getAuthenticatedUserDto()
                .map(user -> user.id().equals(id))
                .orElse(false);
    }

    public boolean isMine(long id) {
        return bookingRepository.findById(id)
                .flatMap(booking -> getAuthenticatedUserDto()
                        .map(user -> user.id().equals(booking.getUser().getId())))
                .orElse(false);
    }

    public boolean isCoach(long id) {
        return userRepository.findById(id)
                .map(user -> user.getRole().equals(UserRole.COACH))
                .orElse(false);
    }
}