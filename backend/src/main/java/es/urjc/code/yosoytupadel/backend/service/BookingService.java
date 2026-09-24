package es.urjc.code.yosoytupadel.backend.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.BookingMapper;
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
            court = courtRepository.findById(bookingDTO.courtId())
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
                throw new ResponseStatusException(HttpStatus.CONFLICT, "The selected time slot is already reserved.");
            }
        }

        User coach = null;
        if (hasCoach) {
            coach = userRepository.findById(bookingDTO.coachId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coach not found"));

            boolean isCoachOccupied = bookingRepository.existsOverlappingCoachBooking(
                    coach.getId(),
                    bookingDTO.bookingDate(),
                    bookingDTO.startTime(),
                    bookingDTO.endTime()
            );

            if (isCoachOccupied) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This coach already has a class scheduled at this time.");
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

    @Scheduled(fixedDelay = 600000) // Se ejecuta automáticamente cada 10 minutos (600000 ms)
    @Transactional
    public void autoCompleteFinishedBookings() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // reservas que acaban de terminar
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
