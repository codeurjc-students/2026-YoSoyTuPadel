package es.urjc.code.yosoytupadel.backend.controller;

import java.net.URI;
import java.util.Collection;
import java.time.LocalDate;

import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.CoachBookingDTO;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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

    @Operation(summary = "Get all bookings (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found all bookings", content = { @Content(mediaType = "application/json") }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("")
    public Collection<BookingDTO> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @Operation(summary = "Get all bookings for the authenticated coach")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found coach bookings", content = { @Content(mediaType = "application/json") }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Coach rights required", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('COACH')")
    @GetMapping("/coach")
    public Collection<CoachBookingDTO> getCoachBookings() {
        return bookingService.getBookingsForCoach(
                bookingService.getAuthenticatedCoachId()
        );
    }

    @Operation(summary = "Get reserved time slots for a specific court on a given date")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved reserved slots", content = { @Content(mediaType = "application/json") }),
            @ApiResponse(responseCode = "400", description = "Invalid parameters supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
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

    @Operation(summary = "Get reserved time slots for a specific coach on a given date")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved reserved slots", content = { @Content(mediaType = "application/json") }),
            @ApiResponse(responseCode = "400", description = "Invalid parameters supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
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

    @Operation(summary = "Get a booking by its id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the booking", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = BookingDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Access denied", content = @Content),
            @ApiResponse(responseCode = "404", description = "Booking not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN') or @userService.isMine(#id)")
    @GetMapping("/{id}")
    public BookingDTO getBooking(@PathVariable long id) {
        return bookingService.getBookingById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    @Operation(summary = "Create a new booking")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Booking created successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = BookingDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid booking data supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    @ResponseStatus(HttpStatus.CREATED)
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

    @Operation(summary = "Cancel a booking by its id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Booking cancelled successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = BookingDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Booking cannot be cancelled", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Access denied", content = @Content),
            @ApiResponse(responseCode = "404", description = "Booking not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN') or @userService.isMine(#id) or @bookingService.isCoachForBooking(#id)")
    @PatchMapping("/{id}")
    public BookingDTO cancelBooking(@PathVariable long id) {
        return bookingService.cancelBooking(id);
    }

    @Operation(summary = "Delete a booking completely (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Booking deleted successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = BookingDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "Booking not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public BookingDTO deleteBooking(@PathVariable long id) {
        return bookingService.deleteBooking(id);
    }
}