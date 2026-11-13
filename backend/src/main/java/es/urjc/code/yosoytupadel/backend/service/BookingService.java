package es.urjc.code.yosoytupadel.backend.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.BookingMapper;
import es.urjc.code.yosoytupadel.backend.dto.CoachBookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserProgressionDTO;
import es.urjc.code.yosoytupadel.backend.entities.*;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import es.urjc.code.yosoytupadel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private BookingMapper mapper;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    public Collection<BookingDTO> getAllBookings() {
        return mapper.toDTOs(bookingRepository.findAll());
    }

    public Collection<BookingDTO> getAllBookingsByUserId(Long userId) {
        return mapper.toDTOs(bookingRepository.findByUserId(userId));
    }

    public Collection<CoachBookingDTO> getBookingsForCoach(Long coachId) {
        return bookingRepository.findByCoachId(coachId).stream()
                .map(booking -> new CoachBookingDTO(
                        mapper.toDTO(booking),
                        userService.getUserById(booking.getUser().getId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found"))
                ))
                .toList();
    }

    public boolean isCoachForBooking(long bookingId) {
        return userService.getAuthenticatedUserDto()
                .filter(user -> user.role().name().equals("COACH"))
                .flatMap(user -> bookingRepository.findById(bookingId)
                        .filter(booking -> booking.getCoach() != null && booking.getCoach().getId().equals(user.id())))
                .isPresent();
    }

    public Long getAuthenticatedCoachId() {
        return userService.getAuthenticatedUserDto()
                .filter(user -> user.role().name().equals("COACH"))
                .map(user -> user.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Coach authentication required"));
    }

    public List<LocalTime> getReservedCourtSlots(Long courtId, LocalDate date) {
        List<Booking> bookings = bookingRepository.findActiveCourtBookings(courtId, date);
        List<LocalTime> reservedSlots = new java.util.ArrayList<>();

        for (int hour = 9; hour <= 21; hour++) {
            LocalTime slotStart = LocalTime.of(hour, 0);
            LocalTime slotEnd = slotStart.plusHours(1);
            boolean isReserved = bookings.stream().anyMatch(booking ->
                    booking.getStartTime().isBefore(slotEnd) && booking.getEndTime().isAfter(slotStart));
            if (isReserved) {
                reservedSlots.add(slotStart);
            }
        }
        return reservedSlots;
    }

    public List<LocalTime> getReservedCoachSlots(Long coachId, LocalDate date) {
        List<Booking> bookings = bookingRepository.findActiveCoachBookings(coachId, date);
        List<LocalTime> reservedSlots = new java.util.ArrayList<>();

        for (int hour = 9; hour <= 19; hour += 2) {
            LocalTime slotStart = LocalTime.of(hour, 0);
            LocalTime slotEnd = slotStart.plusHours(2);
            boolean isReserved = bookings.stream().anyMatch(booking ->
                    booking.getStartTime().isBefore(slotEnd) && booking.getEndTime().isAfter(slotStart));
            if (isReserved) {
                reservedSlots.add(slotStart);
            }
        }
        return reservedSlots;
    }

    public Optional<BookingDTO> getBookingById(long id) {
        return bookingRepository.findById(id).map(mapper::toDTO);
    }

    @Transactional
    public BookingDTO createBooking(BookingDTO bookingDTO) {
        LocalDate today = LocalDate.now();
        LocalDate limitDate = today.plusWeeks(2);

        if (bookingDTO.bookingDate() == null || bookingDTO.bookingDate().isBefore(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reservations cannot be made in the past.");
        }

        if (bookingDTO.bookingDate().isAfter(limitDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can only book up to 14 days in advance.");
        }

        boolean hasCourt = bookingDTO.courtId() != null;
        boolean hasCoach = bookingDTO.coachId() != null;

        if (hasCourt && hasCoach) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A booking cannot have both a court and a coach.");
        }
        if (!hasCourt && !hasCoach) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A booking must have either a court or a coach.");
        }

        Court court = null;
        if (hasCourt) {
            court = courtRepository.findByIdWithLock(bookingDTO.courtId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Court not found"));

            if (!court.getIsAvailable()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This court is closed for maintenance.");
            }

            boolean isOccupied = bookingRepository.existsOverlappingBooking(
                    court.getId(),
                    bookingDTO.bookingDate(),
                    bookingDTO.startTime(),
                    bookingDTO.endTime()
            );

            if (isOccupied) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Este horario ya está reservado actualmente. Por favor, inténtelo de nuevo más tarde o mire otro horario o pista."
                );
            }
        }

        User coach = null;
        if (hasCoach) {
            coach = userRepository.findByIdWithLock(bookingDTO.coachId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coach not found"));

            boolean isCoachOccupied = bookingRepository.existsOverlappingCoachBooking(
                    coach.getId(),
                    bookingDTO.bookingDate(),
                    bookingDTO.startTime(),
                    bookingDTO.endTime()
            );

            if (isCoachOccupied) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Este horario ya está reservado actualmente. Por favor, inténtelo de nuevo más tarde o mire otro horario o pista."
                );
            }
        }

        User user;
        if (bookingDTO.userId() == null) {
            var authUserDto = userService.getAuthenticatedUserDto();
            if (authUserDto.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated.");
            }
            user = userService.getUserEntityById(authUserDto.get().id());
        } else {
            user = userRepository.findById(bookingDTO.userId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        }

        Booking newBooking = mapper.toDomain(bookingDTO);
        newBooking.setCourt(court);
        newBooking.setUser(user);
        newBooking.setCoach(coach);

        if (hasCoach) {
            newBooking.setType(BookingType.TRAINING);
        } else {
            newBooking.setType(BookingType.MATCH);
        }

        newBooking.setStatus(BookingStatus.PENDING);

        if (newBooking.getBookingPrice() == null) {
            if (hasCourt) {
                newBooking.setBookingPrice(court.getCourtPrice());
            } else if (hasCoach){
                Double price = coach.getSessionPrice() != null ? coach.getSessionPrice() : 0.0;
                newBooking.setBookingPrice(price);
            }
        }

        Booking savedBooking = bookingRepository.save(newBooking);
        return mapper.toDTO(savedBooking);
    }

    @Transactional
    public BookingDTO cancelBooking(long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if ( booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The reservation had already been cancelled.");
        }

        if ( booking.getStatus() == BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The reservation cant be cancelled because has already finished.");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        return mapper.toDTO(bookingRepository.save(booking));
    }

    public BookingDTO deleteBooking(long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        bookingRepository.delete(booking);
        return mapper.toDTO(booking);
    }

    public Collection<BookingDTO> getMatchBookingsByUserId(Long userId) {
        return mapper.toDTOs(bookingRepository.findByUserIdAndType(userId, BookingType.MATCH));
    }

    public Collection<BookingDTO> getTrainingBookingsByUserId(Long userId) {
        return mapper.toDTOs(bookingRepository.findByUserIdAndType(userId, BookingType.TRAINING));
    }

    @Transactional(readOnly = true)
    public List<UserProgressionDTO> getUserProgression(Long userId) {
        User user = userService.getUserEntityById(userId);
        double initialLevel = user.getBaseLevel() != null
                ? user.getBaseLevel()
                : user.getSkillLevel() != null ? user.getSkillLevel() : 1.0;
        double currentLevel = initialLevel;
        List<UserProgressionDTO> progression = new ArrayList<>();

        // Fetch exclusively completed training sessions with recorded score
        List<Booking> bookings = bookingRepository.findCompletedTrainingBookingsWithScore(userId);

        // Inject starting data point: 1 month ago if no bookings, or 7 days before the first booking
        LocalDate startDate = bookings.isEmpty()
                ? LocalDate.now().minusMonths(1)
                : bookings.get(0).getBookingDate().minusDays(7);
        progression.add(new UserProgressionDTO(startDate, initialLevel));

        for (Booking booking : bookings) {
            currentLevel = Math.clamp(currentLevel + calculateLevelAdjustment(booking.getScore()), 0.0, 5.0);
            progression.add(new UserProgressionDTO(booking.getBookingDate(), currentLevel));
        }

        LocalDate today = LocalDate.now();
        if (bookings.isEmpty() || !bookings.get(bookings.size() - 1).getBookingDate().isEqual(today)) {
            progression.add(new UserProgressionDTO(today, currentLevel));
        }

        return progression;
    }

    private double calculateLevelAdjustment(String score) {
        if (score == null) {
            return 0.0;
        }

        String normalizedScore = score.trim();
        try {
            // If the score is a pure numeric value between 0 and 10 (e.g., "7.5", "8")
            if (normalizedScore.matches("\\d+(\\.\\d+)?")) {
                double numericScore = Double.parseDouble(normalizedScore);
                // initial leveling prototype
                return (numericScore - 5.0) * 0.05;
            }
        } catch (NumberFormatException ignored) {
            // Malformed historical scores or non-numeric inputs are safely ignored as neutral.
        }
        return 0.0;
    }

    /**
     * Automatically complete finished bookings.
     */
    @Scheduled(fixedDelay = 600000) // It runs automatically every 10 minutes (600,000 ms)
    @Transactional
    public void autoCompleteFinishedBookings() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Reservations that have just ended
        List<Booking> finishedBookings = bookingRepository.findFinishedPendingBookings(today, now);

        for (Booking booking : finishedBookings) {
            booking.setStatus(BookingStatus.COMPLETED);
            userService.processRacketUsageForUser(booking.getUser().getId());
        }

        if (!finishedBookings.isEmpty()) {
            bookingRepository.saveAll(finishedBookings);
        }
    }
}
