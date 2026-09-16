package es.urjc.code.yosoytupadel.backend.dto;

public record RacketDTO(
        Long id,
        String name,
        String brand,
        String description,
        double pricePerDay
) {}
