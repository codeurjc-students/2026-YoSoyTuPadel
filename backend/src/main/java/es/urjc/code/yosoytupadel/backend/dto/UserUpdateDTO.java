package es.urjc.code.yosoytupadel.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateDTO(
        @NotBlank(message = "The name cannot be empty")
        @Size(min = 4, message = "The name must have at least 4 characters")
        String name,

        @Size(min = 4, message = "Nickname must be at least 4 characters long")
        String nickname,

        @NotBlank(message = "The email cannot be empty")
        @Email(message = "The email format is not valid")
        String email,

        Double sessionPrice,

        @Size(min = 8, message = "The password must be at least 8 characters long")
        String password,

        @Min(value = 1, message = "Skill level must be between 1 and 3")
        @Max(value = 3, message = "Skill level must be between 1 and 3")
        Double skillLevel
) {
    @AssertTrue(message = "Skill level must be exactly 1, 2 or 3")
    @JsonIgnore
    public boolean hasValidCertificationLevel() {
        return skillLevel == null
                || skillLevel == 1.0 || skillLevel == 2.0 || skillLevel == 3.0;
    }
}
