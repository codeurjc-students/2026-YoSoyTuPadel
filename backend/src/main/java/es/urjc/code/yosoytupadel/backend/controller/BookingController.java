package es.urjc.code.yosoytupadel.backend.controller;

import java.net.URI;
import java.util.Collection;

import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.BookingMapper;
import es.urjc.code.yosoytupadel.backend.entities.Booking;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import static org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest;


@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingMapper mapper;

    @GetMapping("")
    public Collection<BookingDTO> getAllBookings() {
        return mapper.toDTOs(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public BookingDTO getBooking(@PathVariable long id) {
        return mapper.toDTO(bookingService.getBookingById(id));
    }

    @PostMapping("")
    public ResponseEntity<BookingDTO> createBooking(@RequestBody BookingDTO bookingDTO) {
        Booking booking = mapper.toDomain(bookingDTO);

        booking = bookingService.createBooking(booking);

        BookingDTO responseDTO = mapper.toDTO(booking);
        URI location = fromCurrentRequest().path("/{id}").buildAndExpand(responseDTO.id()).toUri();
        return ResponseEntity.created(location).body(responseDTO);
    }

    @PatchMapping("/{id}")
    public BookingDTO cancelBooking(@PathVariable long id) {
        return mapper.toDTO(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}")
    public BookingDTO deleteBooking(@PathVariable long id) {
        return mapper.toDTO(bookingService.deleteBooking(id));
    }
}