package es.urjc.code.yosoytupadel.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookingDTO(
        Long id,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        Double bookingPrice,
        Boolean isCancelled,
        Long userId,
        Long courtId
) {}
