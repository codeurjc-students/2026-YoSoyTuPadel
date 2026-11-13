package es.urjc.code.yosoytupadel.backend.dto;

import java.time.LocalDate;

public record UserProgressionDTO(LocalDate date, Double currentLevel) {
}
