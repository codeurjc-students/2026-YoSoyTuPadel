package es.urjc.code.yosoytupadel.backend.dto;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import org.mapstruct.Mapper;
import java.util.Collection;
import java.util.List;

@Mapper(componentModel = "spring")
public interface RacketMapper {
    RacketDTO toDTO(Racket racket);
    List<RacketDTO> toDTOs(Collection<Racket> rackets);
    Racket toDomain(RacketDTO racketDTO);
}
