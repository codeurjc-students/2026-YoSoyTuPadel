package es.urjc.code.yosoytupadel.backend.repository;

import es.urjc.code.yosoytupadel.backend.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {


    List<Booking> findByUserId(Long userId);

    // Comprueba solapamientos: Dos reservas se solapan si Inicio A < Fin B y Fin A > Inicio B
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.court.id = :courtId " +
            "AND b.bookingDate = :date " +
            "AND b.isCancelled = false " + // Ignorar reservas canceladas
            "AND b.startTime < :end AND b.endTime > :start")
    boolean existsOverlappingBooking(
            @Param("courtId") Long courtId,
            @Param("date") LocalDate date,
            @Param("start") LocalTime start,
            @Param("end") LocalTime end
    );

    // Paginacion
    //Page<Booking> findByUserId(Long userId, Pageable pageable);
}
