package es.urjc.code.yosoytupadel.backend.dto;

public record RacketDTO(
        Long id,
        String brand,
        String name,
        String description,
        double pricePerDay,
        Integer stock
) {}
