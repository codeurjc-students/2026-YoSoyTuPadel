package es.urjc.code.yosoytupadel.backend.config;

import es.urjc.code.yosoytupadel.backend.entities.*;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Blob;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class DataBaseInitializer {

    @Autowired
    private RacketRepository racketRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() throws IOException, SQLException {

        if (userRepository.findAll().isEmpty()) {

            User admin = new User(
                    "admin@yosoytupadel.com",
                    passwordEncoder.encode("admin"),
                    UserRole.ADMIN
            );

            User student1 = new User(
                    "victor@alumno.com",
                    passwordEncoder.encode("pass"),
                    UserRole.USER
            );

            User coach1 = new User(
                    "coach@yosoytupadel.com",
                    passwordEncoder.encode("coach"),
                    UserRole.COACH,
                    "Juan"
            );
            coach1.setSessionPrice(35.0);

            ClassPathResource imgFileA = new ClassPathResource("static/images/adminProfilePicture.png");
            byte[] imageBytesA;
            try (InputStream inputStream = imgFileA.getInputStream()) {
                imageBytesA = inputStream.readAllBytes();
            }
            Blob imageBlobA = new SerialBlob(imageBytesA);
            admin.setProfilePicture(imageBlobA);

            ClassPathResource imgFile = new ClassPathResource("static/images/profile-picture-default.jpg");
            byte[] imageBytes;
            try (InputStream inputStream = imgFile.getInputStream()) {
                imageBytes = inputStream.readAllBytes();
            }
            Blob imageBlob = new SerialBlob(imageBytes);
            student1.setProfilePicture(imageBlob);

            ClassPathResource imgFilet = new ClassPathResource("static/images/entrenador1.jpg");
            byte[] imageBytest;
            try (InputStream inputStream = imgFilet.getInputStream()) {
                imageBytest = inputStream.readAllBytes();
            }
            Blob imageBlobt = new SerialBlob(imageBytest);
            coach1.setProfilePicture(imageBlobt);

            userRepository.saveAll(List.of(admin, student1, coach1));
        }

        if (racketRepository.count() == 0) {

            Racket racket1 = new Racket(
                    "Nox",
                    "ML10 Pro Cup",
                    "La mítica pala de Miguel Lamperti. Control absoluto y gran salida de bola.",
                    5.0
            );

            Racket racket2 = new Racket(
                    "Bullpadel",
                    "Vertex 04",
                    "Pala de potencia pura para jugadores agresivos. Superficie rugosa.",
                    7.5
            );

            Racket racket3 = new Racket(
                    "Adidas",
                    "Metalbone HRD",
                    "La pala de Ale Galán. Personalización de pesos y máxima rigidez.",
                    8.0
            );

            Racket racket4 = new Racket(
                    "Head",
                    "Extreme Pro",
                    "Pala de potencia con formato diamante. Actualmente en reparación.",
                    6.0
            );

            ClassPathResource imgFile0 = new ClassPathResource("static/images/NoxML10.png");
            byte[] imageBytes0;
            try (InputStream inputStream = imgFile0.getInputStream()) {
                imageBytes0 = inputStream.readAllBytes();
            }
            Blob imageBlob0 = new SerialBlob(imageBytes0);
            racket1.setImage(imageBlob0);

            ClassPathResource imgFile1 = new ClassPathResource("static/images/BullVertex04.jpg");
            byte[] imageBytes1;
            try (InputStream inputStream = imgFile1.getInputStream()) {
                imageBytes1 = inputStream.readAllBytes();
            }
            Blob imageBlob1 = new SerialBlob(imageBytes1);
            racket2.setImage(imageBlob1);

            ClassPathResource imgFile2 = new ClassPathResource("static/images/AdidasMetalbone.jpg");
            byte[] imageBytes2;
            try (InputStream inputStream = imgFile2.getInputStream()) {
                imageBytes2 = inputStream.readAllBytes();
            }
            Blob imageBlob2 = new SerialBlob(imageBytes2);
            racket3.setImage(imageBlob2);

            ClassPathResource imgFile3 = new ClassPathResource("static/images/HeadExtreme.png");
            byte[] imageBytes3;
            try (InputStream inputStream = imgFile3.getInputStream()) {
                imageBytes3 = inputStream.readAllBytes();
            }
            Blob imageBlob3 = new SerialBlob(imageBytes3);
            racket4.setImage(imageBlob3);

            racketRepository.saveAll(List.of(racket1, racket2, racket3, racket4));
        }
        if (courtRepository.count() == 0) {
            Court court1 = new Court(
                    "Alameda de Osuna",
                    8.0,
                    CourtType.INDOOR,
                    SurfaceType.GLASS
            );

            Court court2 = new Court(
                    "Coslada",
                    7.0,
                    CourtType.INDOOR,
                    SurfaceType.WALL
            );

            Court court3 = new Court(
                    "Torrejon",
                    6.0,
                    CourtType.OUTDOOR,
                    SurfaceType.WALL
            );

            Court court4 = new Court(
                    "Alcala",
                    9.0,
                    CourtType.INDOOR,
                    SurfaceType.GLASS
            );

            courtRepository.saveAll(List.of(court1, court2, court3, court4));
        }
        if (bookingRepository.count() == 0){

            LocalDate today = LocalDate.now();

            Booking b1 = new Booking(
                    today.plusDays(0),
                    LocalTime.of(10, 0),
                    LocalTime.of(11, 30),
                    courtRepository.findById(1L).orElseThrow().getCourtPrice(),
                    userRepository.getReferenceById(2L),
                    courtRepository.findById(1L).orElseThrow()
            );

            Booking b2 = new Booking(today.plusDays(2),
                    LocalTime.of(18, 0),
                    LocalTime.of(19, 30),
                    courtRepository.findById(2L).orElseThrow().getCourtPrice(),
                    userRepository.getReferenceById(2L),
                    courtRepository.findById(2L).orElseThrow()
            );

            Booking b3 = new Booking(today.plusDays(5)
                    , LocalTime.of(20, 0),
                    LocalTime.of(21, 30),
                    courtRepository.findById(1L).orElseThrow().getCourtPrice(),
                    userRepository.getReferenceById(2L),
                    courtRepository.findById(1L).orElseThrow()
            );

            Booking b4 = new Booking(today.plusDays(3),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 30),
                    courtRepository.findById(2L).orElseThrow().getCourtPrice(),
                    userRepository.getReferenceById(2L),
                    userRepository.getReferenceById(3L)
            );


            bookingRepository.saveAll(List.of(b1, b2, b3, b4));

        }
    }
}