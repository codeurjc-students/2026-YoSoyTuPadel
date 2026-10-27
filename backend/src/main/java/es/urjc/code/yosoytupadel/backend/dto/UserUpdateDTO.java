package es.urjc.code.yosoytupadel.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateDTO(
        @NotBlank(message = "The name cannot be empty")
        @Size(min = 4, message = "The name must have at least 4 characters")
        String name,

        @NotBlank(message = "The nickname cannot be empty")
        @Size(min = 4, message = "Nickname must be at least 4 characters long")
        String nickname,

        @NotBlank(message = "The email cannot be empty")
        @Email(message = "The email format is not valid")
        String email,

        Double sessionPrice,

        @Size(min = 8, message = "The password must be at least 8 characters long")
        String password
) {}
