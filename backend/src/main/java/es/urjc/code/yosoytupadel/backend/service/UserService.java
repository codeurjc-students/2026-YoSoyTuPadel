package es.urjc.code.yosoytupadel.backend.service;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.Collection;
import java.util.NoSuchElementException;

@Service
public class UserService {

    private final UserRepository userRepository;

    private final RacketRepository racketRepository;

    public UserService(UserRepository userRepository, RacketRepository racketRepository) {
        this.userRepository = userRepository;
        this.racketRepository = racketRepository;
    }

    public Collection<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(long id) {
        return userRepository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("This email already exists.");
        }


        if (user.getSkillLevel() == null) {
            user.setSkillLevel(1.0); // Nivel base por defecto
        }

        return userRepository.save(user);
    }

    @Transactional
    public User updateSkillLevel(long studentId, Double change) {

//        if (requesterRole != UserRole.COACH && requesterRole != UserRole.ADMIN) {
//            throw new SecurityException("No tienes permisos para modificar el nivel de un alumno.");
//        }

        User student = getUserById(studentId);

        double newLevel = student.getSkillLevel() + change;
        if (newLevel > 7.0) newLevel = 7.0;
        if (newLevel < 1.0) newLevel = 1.0;

        student.setSkillLevel(newLevel);

        return student;
    }

    @Transactional
    public User deleteUser(long id) {
        User user = getUserById(id);
        userRepository.deleteById(id);
        return user;
    }

    @Transactional
    public User rentRacket(long userId, long racketId) {
        User user = getUserById(userId);

        Racket racket = racketRepository.findById(racketId)
                .orElseThrow(() -> new IllegalArgumentException("The racket does not exists."));


        user.setRacket(racket);
        return user;
    }

    @Transactional
    public User returnRacket(long userId) {
        User user = getUserById(userId);

        user.setRacket(null);

        return user;
    }

//    public void createUserImage(long id, URI location, InputStream inputStream, long size) {
//
//        User user = userRepository.findById(id).orElseThrow();
//
//        user.setImgUserPath(location.toString()); // convert URI to String
//        user.setProfilePicture(BlobProxy.generateProxy(inputStream, size)); // convert InputStream to Blob
//
//        userRepository.save(user);
//
//    }

    public InputStreamResource getUserImage(long id) throws SQLException {

        User user = userRepository.findById(id).orElseThrow();

        if (user.getProfilePicture() != null) {
            return new InputStreamResource(user.getProfilePicture().getBinaryStream());
        } else {
            throw new NoSuchElementException();
        }
    }

    public void replaceUserImage(long id, InputStream inputStream, long size) {

        User user = userRepository.findById(id).orElseThrow();
        user.setProfilePicture(BlobProxy.generateProxy(inputStream, size));
        userRepository.save(user);
    }

    public void deleteUserImage(long id) throws IOException, SQLException {
        User user = userRepository.findById(id).orElseThrow();
        if(user.getProfilePicture() == null){
            throw new NoSuchElementException();
        }
        ClassPathResource imgFileDefault = new ClassPathResource("static/images/profile-picture-default.jpg");
        byte[] imageBytesDefault = Files.readAllBytes(imgFileDefault.getFile().toPath());
        Blob imageBlobDefault = new SerialBlob(imageBytesDefault);
        user.setProfilePicture(imageBlobDefault);
        userRepository.save(user);
    }
}