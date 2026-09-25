package es.urjc.code.yosoytupadel.backend.dto;

import es.urjc.code.yosoytupadel.backend.entities.CourtType;
import es.urjc.code.yosoytupadel.backend.entities.SurfaceType;

public record CourtDTO(
        Long id,
        String name,
        Double courtPrice,
        CourtType type,
        SurfaceType surface,
        Boolean isAvailable
) {}