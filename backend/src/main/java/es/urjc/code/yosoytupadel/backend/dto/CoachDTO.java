package es.urjc.code.yosoytupadel.backend.dto;


import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CoachDTO(
        Long id,
        String name,
        Double skillLevel,
        Double sessionPrice
) {}
