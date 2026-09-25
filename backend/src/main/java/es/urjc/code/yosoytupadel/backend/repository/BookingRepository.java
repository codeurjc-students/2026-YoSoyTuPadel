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

    List<Booking> findByUserIdAndType(Long userId, es.urjc.code.yosoytupadel.backend.entities.BookingType type);

    // Comprueba solapamientos de horarios
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.court.id = :courtId " +
            "AND b.bookingDate = :date " +
            "AND b.status <> es.urjc.code.yosoytupadel.backend.entities.BookingStatus.CANCELLED " +
            "AND b.startTime < :end AND b.endTime > :start")
    boolean existsOverlappingBooking(
            @Param("courtId") Long courtId,
            @Param("date") LocalDate date,
            @Param("start") LocalTime start,
            @Param("end") LocalTime end
    );

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.coach.id = :coachId " +
            "AND b.bookingDate = :date " +
            "AND b.status != 'CANCELLED' " +
            "AND b.startTime < :endTime AND b.endTime > :startTime")
    boolean existsOverlappingCoachBooking(
            @Param("coachId") Long coachId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query("SELECT b FROM Booking b WHERE b.status = es.urjc.code.yosoytupadel.backend.entities.BookingStatus.PENDING " +
            "AND (b.bookingDate < :currentDate OR (b.bookingDate = :currentDate AND b.endTime <= :currentTime))")
    List<Booking> findFinishedPendingBookings(
            @Param("currentDate") java.time.LocalDate currentDate,
            @Param("currentTime") java.time.LocalTime currentTime
    );

    // Paginacion
    //Page<Booking> findByUserId(Long userId, Pageable pageable);
}
