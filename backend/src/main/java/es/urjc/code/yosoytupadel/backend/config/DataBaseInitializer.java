package es.urjc.code.yosoytupadel.backend.config;

import es.urjc.code.yosoytupadel.backend.entities.*;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.io.InputStream;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@ConditionalOnProperty(name = "app.load-sample-data", havingValue = "true")
public class DataBaseInitializer implements CommandLineRunner {

    private final RacketRepository racketRepository;
    private final CourtRepository courtRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataBaseInitializer(
            RacketRepository racketRepository,
            CourtRepository courtRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.racketRepository = racketRepository;
        this.courtRepository = courtRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws IOException, SQLException {
        seedUsers();
        seedRackets();
        seedCourts();
        seedBookings();
    }

    private void seedUsers() throws IOException, SQLException {
        Set<String> emails = new HashSet<>(
                userRepository.findAll().stream().map(User::getEmail).toList()
        );
        List<User> newUsers = new ArrayList<>();

        if (emails.add("admin@yosoytupadel.com")) {
            User admin = new User(
                    "Administrador",
                    "admin",
                    "admin@yosoytupadel.com",
                    passwordEncoder.encode("admin"),
                    UserRole.ADMIN
            );
            admin.setProfilePicture(imageBlob("static/images/adminProfilePicture.png"));
            newUsers.add(admin);
        }

        if (emails.add("victor@alumno.com")) {
            User student = new User(
                    "Victor",
                    "victorcc02",
                    "victor@alumno.com",
                    passwordEncoder.encode("pass"),
                    UserRole.USER
            );
            student.setProfilePicture(imageBlob("static/images/profile-picture-default.jpg"));
            newUsers.add(student);
        }

        List<CoachSample> coaches = List.of(
                new CoachSample("Juan Perez", "coach@yosoytupadel.com", 1, 35.0, "entrenador1.jpg"),
                new CoachSample("Lucía Martín", "lucia.coach@yosoytupadel.com", 2, 38.0, "entrenador2.jpg"),
                new CoachSample("Carlos Ruiz", "carlos.coach@yosoytupadel.com", 3, 40.0, "entrenador3.jpg"),
                new CoachSample("Marta Sánchez", "marta.coach@yosoytupadel.com", 1, 36.0, "entrenador4.jpg"),
                new CoachSample("Diego López", "diego.coach@yosoytupadel.com", 2, 42.0, "entrenador5.jpg"),
                new CoachSample("Paula Gómez", "paula.coach@yosoytupadel.com", 3, 37.0, "entrenador6.jpg"),
                new CoachSample("Álvaro Pérez", "alvaro.coach@yosoytupadel.com", 1, 39.0, "entrenador7.jpg"),
                new CoachSample("Elena Torres", "elena.coach@yosoytupadel.com", 2, 41.0, "entrenador8.jpg"),
                new CoachSample("Sergio Ramos", "sergio.coach@yosoytupadel.com", 3, 44.0, "entrenador9.jpg")
        );
        for (CoachSample sample : coaches) {
            if (emails.add(sample.email())) {
                User coach = new User(
                        sample.email(),
                        passwordEncoder.encode("coach"),
                        UserRole.COACH,
                        sample.name()
                );
                coach.setSkillLevel((double) sample.skillLevel());
                coach.setSessionPrice(sample.sessionPrice());
                coach.setProfilePicture(imageBlob("static/images/" + sample.imageName()));
                newUsers.add(coach);
            } else {
                userRepository.findByEmail(sample.email())
                        .filter(coach -> coach.getRole() == UserRole.COACH)
                        .filter(coach -> coach.getSkillLevel() == null
                                || Double.compare(coach.getSkillLevel(), sample.skillLevel()) != 0)
                        .ifPresent(coach -> {
                            coach.setSkillLevel((double) sample.skillLevel());
                            newUsers.add(coach);
                        });
            }
        }

        userRepository.saveAll(newUsers);

        List<User> existingCoaches = userRepository.findByRole(UserRole.COACH);
        List<User> coachesWithRemovedNicknames = new ArrayList<>();
        for (User coach : existingCoaches) {
            if (coach.getNickname() != null) {
                coach.setNickname(null);
                coachesWithRemovedNicknames.add(coach);
            }
        }
        if (!coachesWithRemovedNicknames.isEmpty()) {
            userRepository.saveAll(coachesWithRemovedNicknames);
        }
    }

    private void seedRackets() throws IOException, SQLException {
        Set<String> existing = new HashSet<>(
                racketRepository.findAll().stream()
                        .map(racket -> racket.getBrand() + "|" + racket.getName())
                        .toList()
        );
        List<RacketSample> samples = List.of(
                new RacketSample("Nox", "ML10 Pro Cup", "Pala redonda de control y amplio punto dulce, asociada a Miguel Lamperti.", 5.0, 5, "NoxML10.png"),
                new RacketSample("Nox", "AT10 Genius 18K Alum", "Pala polivalente de la gama AT10 con carbono 18K y tacto equilibrado.", 8.0, 1, "Nox-Genius-18k.jpg"),
                new RacketSample("Nox", "AT10 Genius Attack 18K", "Formato diamante para jugadores avanzados que buscan potencia.", 8.5, 3, "Nox-Genius-Attack-18K.jpg"),
                new RacketSample("Nox", "AT10 Luxury Genius 12K", "Pala polivalente con carbono 12K y balance medio.", 7.5, 3, "Nox-Luxury-Genius-12K.jpg"),
                new RacketSample("Nox", "ML10 Luxury Bahia 12K", "Pala de control y salida de bola con formato redondo.", 7.0, 2, "Nox-Luxury-Bahia-12K.jpg"),
                new RacketSample("Bullpadel", "Vertex 04", "Pala de potencia con forma de diamante y balance alto.", 7.5, 5, "BullVertex04.jpg"),
                new RacketSample("Bullpadel", "Hack 04", "Pala de potencia con formato diamante, diseñada para juego ofensivo.", 8.0, 3, "BullHack04.jpg"),
                new RacketSample("Bullpadel", "Neuron 02", "Pala polivalente de tacto firme y formato híbrido.", 7.5, 2, "BullNeuron02.jpg"),
                new RacketSample("Bullpadel", "Ionic Power", "Pala de potencia para jugadores de nivel intermedio y avanzado.", 6.0, 4, "BullIonicPower.jpg"),
                new RacketSample("Bullpadel", "Flow", "Pala ligera y manejable de formato diamante.", 5.5, 3, "BullFlow.jpg"),
                new RacketSample("Adidas", "Metalbone HRD", "Pala de potencia con estructura rígida y sistema de pesos ajustables.", 8.0, 4, "AdidasMetalbone.jpg"),
                new RacketSample("Adidas", "Metalbone Carbon", "Pala polivalente con carbono y balance orientado al ataque.", 7.0, 3, "AdidasMetalboneCarbon.jpg"),
                new RacketSample("Adidas", "Metalbone Team", "Pala de forma diamante para jugadores que buscan potencia accesible.", 5.5, 4, "AdidasMetalboneTeam.jpg"),
                new RacketSample("Adidas", "Adipower Multiweight CTRL", "Pala de control con pesos personalizables.", 8.0, 2, "AdidasAdipowerMultiweightCTRL.jpg"),
                new RacketSample("Head", "Extreme Pro", "Pala de potencia en forma de diamante para jugadores avanzados.", 6.0, 3, "HeadExtreme.png"),
                new RacketSample("Head", "Speed Pro X", "Pala polivalente con equilibrio entre velocidad, control y potencia.", 7.5, 3, "HeadSpeedProX.jpg"),
                new RacketSample("Head", "Radical Motion", "Pala ligera de control para jugadores que priorizan maniobrabilidad.", 6.5, 2, "HeadRadicalMotion.jpg"),
                new RacketSample("Head", "Evo Speed", "Pala cómoda y manejable para iniciación y nivel intermedio.", 3.5, 5, "HeadEvoSpeed.jpg"),
                new RacketSample("Babolat", "Technical Viper", "Pala de potencia con forma de diamante para juego técnico ofensivo.", 8.0, 3, "BabolatTechnicalViper.jpg"),
                new RacketSample("Babolat", "Air Viper", "Pala ligera y rápida para jugadores dinámicos.", 7.5, 2, "BabolatAirViper.jpg"),
                new RacketSample("Babolat", "Counter Viper", "Pala de control y precisión con amplio punto dulce.", 7.5, 3, "BabolatCounterViper.jpg"),
                new RacketSample("Babolat", "Technical Veron", "Pala de potencia con tacto más elástico y manejable.", 6.5, 3, "BabolatTechnicalVeron.jpg"),
                new RacketSample("Wilson", "Bela Pro V2.5", "Pala de potencia y precisión desarrollada para juego avanzado.", 8.5, 2, "WilsonBelaProV2-5.jpg"),
                new RacketSample("Wilson", "Blade Pro V3", "Pala polivalente de tacto firme con buena precisión.", 7.5, 3, "WilsonBladeProV3.jpg"),
                new RacketSample("Siux", "Electra ST3", "Pala polivalente con balance medio y respuesta ofensiva.", 8.0, 2, "SiuxElectraST3.jpg"),
                new RacketSample("Siux", "Diablo Revolution Pro 3", "Pala híbrida para jugadores que combinan control y potencia.", 8.0, 2, "SiuxDiabloRevolutionPro3.jpg"),
                new RacketSample("Babolat", "Air Veron", "Pala ligera y manejable para un juego rápido y ofensivo.", 6.5, 3, "BabolatAirVeron.jpg"),
                new RacketSample("Head", "Speed Motion", "Pala polivalente ligera con buen equilibrio entre control y potencia.", 7.0, 2, "HeadSpeedMotion.jpg"),
                new RacketSample("StarVie", "Triton Pro", "Pala de potencia con forma de lágrima y balance alto.", 8.0, 2, "Triton-Pro.jpg"),
                new RacketSample("Bullpadel", "Hack 03", "Pala de potencia de formato diamante para jugadores ofensivos.", 7.5, 3, "Bull-Hack-03.jpg")
        );

        List<Racket> newRackets = new ArrayList<>();
        for (RacketSample sample : samples) {
            if (existing.add(sample.brand() + "|" + sample.name())) {
                Racket racket = new Racket(sample.brand(), sample.name(), sample.description(), sample.pricePerDay());
                racket.setStock(sample.stock());
                racket.setImage(imageBlob("static/images/" + sample.imageName()));
                newRackets.add(racket);
            }
        }
        racketRepository.saveAll(newRackets);
    }

    private void seedCourts() {
        Set<String> existing = new HashSet<>(
                courtRepository.findAll().stream().map(Court::getName).toList()
        );
        List<CourtSample> samples = List.of(
                new CourtSample("Chamberí", 9.0, CourtType.INDOOR, SurfaceType.GLASS),
                new CourtSample("Retiro", 8.0, CourtType.OUTDOOR, SurfaceType.GLASS),
                new CourtSample("Chamartín", 10.0, CourtType.INDOOR, SurfaceType.GLASS),
                new CourtSample("Arganzuela", 7.0, CourtType.OUTDOOR, SurfaceType.WALL),
                new CourtSample("Salamanca", 11.0, CourtType.INDOOR, SurfaceType.GLASS),
                new CourtSample("Tetuán", 8.0, CourtType.INDOOR, SurfaceType.WALL),
                new CourtSample("Moncloa-Aravaca", 7.0, CourtType.OUTDOOR, SurfaceType.GLASS),
                new CourtSample("Fuencarral-El Pardo", 8.0, CourtType.INDOOR, SurfaceType.GLASS),
                new CourtSample("Latina", 6.0, CourtType.OUTDOOR, SurfaceType.WALL),
                new CourtSample("Carabanchel", 7.0, CourtType.INDOOR, SurfaceType.GLASS),
                new CourtSample("Usera", 6.0, CourtType.OUTDOOR, SurfaceType.WALL),
                new CourtSample("Puente de Vallecas", 6.0, CourtType.INDOOR, SurfaceType.GLASS),
                new CourtSample("Moratalaz", 7.0, CourtType.OUTDOOR, SurfaceType.GLASS),
                new CourtSample("Ciudad Lineal", 8.0, CourtType.INDOOR, SurfaceType.WALL),
                new CourtSample("Hortaleza", 9.0, CourtType.INDOOR, SurfaceType.GLASS),
                new CourtSample("Villaverde", 6.0, CourtType.OUTDOOR, SurfaceType.WALL),
                new CourtSample("Centro", 9.0, CourtType.INDOOR, SurfaceType.GLASS),
                new CourtSample("Barajas", 8.0, CourtType.OUTDOOR, SurfaceType.GLASS),
                new CourtSample("San Blas-Canillejas", 7.0, CourtType.INDOOR, SurfaceType.WALL),
                new CourtSample("Vicálvaro", 6.0, CourtType.OUTDOOR, SurfaceType.GLASS)
        );

        List<Court> newCourts = samples.stream()
                .filter(sample -> existing.add(sample.name()))
                .map(sample -> new Court(sample.name(), sample.price(), sample.type(), sample.surface()))
                .toList();
        courtRepository.saveAll(newCourts);
    }

    private void seedBookings() {
        if (bookingRepository.count() > 0) {
            return;
        }

        User student = userRepository.findByEmail("victor@alumno.com").orElse(null);
        List<User> coaches = userRepository.findByRole(UserRole.COACH);
        List<Court> courts = courtRepository.findAll();
        if (student == null || coaches.isEmpty() || courts.size() < 3) {
            return;
        }

        LocalDate today = LocalDate.now();
        bookingRepository.saveAll(List.of(
                new Booking(today.plusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0),
                        courts.get(0).getCourtPrice(), student, courts.get(0)),
                new Booking(today.plusDays(2), LocalTime.of(18, 0), LocalTime.of(19, 0),
                        courts.get(1).getCourtPrice(), student, courts.get(1)),
                new Booking(today.plusDays(5), LocalTime.of(20, 0), LocalTime.of(21, 0),
                        courts.get(2).getCourtPrice(), student, courts.get(2)),
                new Booking(today.plusDays(3), LocalTime.of(9, 0), LocalTime.of(10, 0),
                        coaches.get(0).getSessionPrice(), student, coaches.get(0))
        ));
    }

    private java.sql.Blob imageBlob(String classpath) throws IOException, SQLException {
        ClassPathResource image = new ClassPathResource(classpath);
        try (InputStream inputStream = image.getInputStream()) {
            return new SerialBlob(inputStream.readAllBytes());
        }
    }

    private record CoachSample(
            String name,
            String email,
            int skillLevel,
            double sessionPrice,
            String imageName
    ) {}

    private record RacketSample(
            String brand,
            String name,
            String description,
            double pricePerDay,
            int stock,
            String imageName
    ) {}

    private record CourtSample(
            String name,
            double price,
            CourtType type,
            SurfaceType surface
    ) {}
}
