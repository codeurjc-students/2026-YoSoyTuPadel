package es.urjc.code.yosoytupadel.backend.dto;

import es.urjc.code.yosoytupadel.backend.entities.UserRole;

public record UserDTO(
        Long id,
        String name,
        String nickname,
        String email,
        UserRole role,
        Double skillLevel,
        Long racketId
) {}
