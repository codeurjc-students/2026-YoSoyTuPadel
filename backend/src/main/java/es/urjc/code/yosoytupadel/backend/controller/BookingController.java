package es.urjc.code.yosoytupadel.backend.controller;

import java.net.URI;
import java.util.Collection;
import java.time.LocalDate;
import java.time.LocalTime;

import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;


    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("")
    public Collection<BookingDTO> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/courts/{courtId}/availability")
    public Collection<String> getReservedCourtSlots(
            @PathVariable long courtId,
            @RequestParam LocalDate date
    ) {
        return bookingService.getReservedCourtSlots(courtId, date).stream()
                .map(time -> time.toString().substring(0, 5))
                .toList();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/coaches/{coachId}/availability")
    public Collection<String> getReservedCoachSlots(
            @PathVariable long coachId,
            @RequestParam LocalDate date
    ) {
        return bookingService.getReservedCoachSlots(coachId, date).stream()
                .map(time -> time.toString().substring(0, 5))
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMine(#id)")
    @GetMapping("/{id}")
    public BookingDTO getBooking(@PathVariable long id) {
        return bookingService.getBookingById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("")
    public ResponseEntity<BookingDTO> createBooking(@RequestBody BookingDTO bookingDTO) {
        BookingDTO responseDTO = bookingService.createBooking(bookingDTO);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(responseDTO.id())
                .toUri();
        return ResponseEntity.created(location).body(responseDTO);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMine(#id)")
    @PatchMapping("/{id}")
    public BookingDTO cancelBooking(@PathVariable long id) {
        return bookingService.cancelBooking(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public BookingDTO deleteBooking(@PathVariable long id) {
        return bookingService.deleteBooking(id);
    }
}