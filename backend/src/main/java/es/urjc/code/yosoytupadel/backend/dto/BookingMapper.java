package es.urjc.code.yosoytupadel.backend.dto;

import es.urjc.code.yosoytupadel.backend.entities.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.Collection;
import java.util.List;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "court.id", target = "courtId")
    @Mapping(source = "coach.id", target = "coachId")
    BookingDTO toDTO(Booking booking);

    List<BookingDTO> toDTOs(Collection<Booking> bookings);

    @Mapping(source = "userId", target = "user.id")
    @Mapping(source = "courtId", target = "court.id")
    @Mapping(source = "coachId", target = "coach.id")
    Booking toDomain(BookingDTO bookingDTO);
}
