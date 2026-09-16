package es.urjc.code.yosoytupadel.backend.service;

import java.time.LocalDate;
import java.util.Collection;
import java.util.NoSuchElementException;

import es.urjc.code.yosoytupadel.backend.entities.Booking;
import es.urjc.code.yosoytupadel.backend.entities.Court;
import es.urjc.code.yosoytupadel.backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CourtService courtService;

    public Collection<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(long id) {
        return bookingRepository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    @Transactional
    public Booking createBooking(Booking newBooking) {
        LocalDate today = LocalDate.now();
        LocalDate limitDate = today.plusWeeks(2); // maximo 2 semanas

        if (newBooking.getBookingDate().isBefore(today)) {
            throw new IllegalArgumentException("Reservations cannot be made in the past.");
        }

        if (newBooking.getBookingDate().isAfter(limitDate)) {
            throw new IllegalArgumentException("You can only book up to 14 days in advance.");
        }

        Court court = courtService.getCourtById(newBooking.getCourt().getId());

        if (!court.getIsAvailable()) {
            throw new IllegalStateException("\n" + "This court is closed for maintenance.");
        }

        boolean isOccupied = bookingRepository.existsOverlappingBooking(
                court.getId(),
                newBooking.getBookingDate(),
                newBooking.getStartTime(),
                newBooking.getEndTime()
        );

        if (isOccupied) {
            throw new IllegalStateException("The selected time slot is already reserved.");
        }

        newBooking.setIsCancelled(false);

        if (newBooking.getBookingPrice() == null) {
            newBooking.setBookingPrice(court.getCourtPrice());
        }

        return bookingRepository.save(newBooking);
    }

    @Transactional
    public Booking cancelBooking(long id) {
        Booking booking = getBookingById(id);

        if (booking.getIsCancelled()) {
            throw new IllegalStateException("\n" + "The reservation had already been cancelled.");
        }
        booking.setIsCancelled(true);
        return bookingRepository.save(booking);
    }

    public Booking deleteBooking(long id){
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
        return booking;
    }
}
