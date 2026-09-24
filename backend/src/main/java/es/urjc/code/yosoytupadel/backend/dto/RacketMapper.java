package es.urjc.code.yosoytupadel.backend.dto;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collection;
import java.util.List;

@Mapper(componentModel = "spring")
public interface RacketMapper {


    RacketDTO toDTO(Racket racket);
    List<RacketDTO> toDTOs(Collection<Racket> rackets);

    @Mapping(target = "image", ignore = true)
    @Mapping(target = "racketImagePath", ignore = true)
    Racket toDomain(RacketDTO racketDTO);

    PreRacketDTO toPreDTO(Racket racket);
    Collection<PreRacketDTO> toPreDTOs(Collection<Racket> rackets);
}
