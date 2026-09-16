package es.urjc.code.yosoytupadel.backend.dto;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import es.urjc.code.yosoytupadel.backend.entities.User;
import java.util.Collection;
import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "racket.id", target = "racketId")
    UserDTO toDTO(User user);

    List<UserDTO> toDTOs(Collection<User> users);

    @Mapping(source = "racketId", target = "racket.id")
    User toDomain(UserDTO userDTO);
}