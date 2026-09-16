package es.urjc.code.yosoytupadel.backend.dto;

import es.urjc.code.yosoytupadel.backend.entities.Court;
import org.mapstruct.Mapper;

import java.util.Collection;
import java.util.List;

@Mapper(componentModel = "spring")
public interface CourtMapper {
    CourtDTO toDTO(Court court);
    List<CourtDTO> toDTOs(Collection<Court> courts);
    Court toDomain(CourtDTO courtDTO);
}
