package es.urjc.code.yosoytupadel.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CoachCreateDTO(
        @NotBlank(message = "Name is required")
        @Size(min = 4, message = "Name must have at least 4 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must have at least 8 characters")
        String password,

        @NotNull(message = "Session price is required")
        @PositiveOrZero(message = "Session price must be zero or greater")
        Double sessionPrice,

        @NotNull(message = "Skill level is required")
        @Min(value = 1, message = "Skill level must be between 1 and 3")
        @Max(value = 3, message = "Skill level must be between 1 and 3")
        Double skillLevel
) {
    @AssertTrue(message = "Skill level must be exactly 1, 2 or 3")
    @JsonIgnore
    public boolean hasValidCertificationLevel() {
        return skillLevel != null
                && (skillLevel == 1.0 || skillLevel == 2.0 || skillLevel == 3.0);
    }
}
