package es.urjc.code.yosoytupadel.backend.dto;

public record CoachBookingDTO(
        BookingDTO booking,
        UserDTO client
) {}
