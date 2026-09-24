package es.urjc.code.yosoytupadel.backend.dto;

import es.urjc.code.yosoytupadel.backend.entities.BookingStatus;
import es.urjc.code.yosoytupadel.backend.entities.BookingType;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookingDTO(
        Long id,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        Double bookingPrice,
        BookingType type,
        BookingStatus status,
        String score,
        Long userId,
        Long courtId,
        Long coachId
) {}
