package es.urjc.code.yosoytupadel.backend.dto;

import jakarta.validation.constraints.Size;

public record UserUpdateDTO(
        @Size(min = 2, message = "Name must be at least 2 characters long")
        String name,

        @Size(min = 2, message = "Nickname must be at least 2 characters long")
        String nickname,

        String email
) {}
