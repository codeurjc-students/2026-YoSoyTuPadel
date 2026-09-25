package es.urjc.code.yosoytupadel.backend.dto;

import org.mapstruct.*;
import es.urjc.code.yosoytupadel.backend.entities.User;

import java.util.Collection;
import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "racket.id", target = "racketId")
    @Mapping(target = "password", ignore = true)
    UserDTO toDTO(User user);

    List<UserDTO> toDTOs(Collection<User> users);

    @Mapping(source = "racketId", target = "racket.id")
    @Mapping(target = "encodedPassword", ignore = true)
    @Mapping(target = "profilePicture", ignore = true)
    @Mapping(target = "imgUserPath", ignore = true)
    @Mapping(target = "racketUsages", ignore = true)
    @Mapping(target = "sessionPrice", ignore = true)
    User toDomain(UserDTO userDTO);

    default CoachDTO toCoachDTO(User user) {
        if (user == null) {
            return null;
        }
        return new CoachDTO(
                user.getId(),
                user.getName(),
                user.getSkillLevel(),
                user.getSessionPrice()
        );
    }

    default UserUpdateDTO toUserUpdateDTO(User user) {
        if (user == null) {
            return null;
        }
        return new UserUpdateDTO(
                user.getName(),
                user.getNickname(),
                user.getEmail()
        );
    }

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,  unmappedTargetPolicy = ReportingPolicy.IGNORE)
    void updateUserFromDTO(UserUpdateDTO updateDTO, @MappingTarget User entity);
}