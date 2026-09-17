package es.urjc.code.yosoytupadel.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserDTO(
        Long id,
        String name,
        String nickname,

        @Email(message = "Email must be valid")
        @NotBlank(message = "Email is required")
        @Schema(description = "Email address of the user", example = "john.doe@example.com")
        String email,

        @NotBlank(message = "Password is required")
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        @Schema(description = "Password for authentication (write-only field)", accessMode = Schema.AccessMode.WRITE_ONLY)
        String password,

        UserRole role,
        Double skillLevel,
        Long racketId
) {}
