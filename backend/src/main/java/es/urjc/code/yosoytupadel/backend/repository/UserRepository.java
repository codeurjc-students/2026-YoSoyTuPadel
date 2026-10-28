package es.urjc.code.yosoytupadel.backend.repository;

import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import es.urjc.code.yosoytupadel.backend.entities.User;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    @EntityGraph(attributePaths = {"racketHistory"})
    Optional<User> findWithRacketHistoryByEmail(String email);
    Optional<User> findByNickname(String nickname);
    boolean existsByEmail(String email);
    List<User> findByRole(UserRole role);
    Page<User> findAllByRole(UserRole role, Pageable pageable);
    Optional<User> findByIdAndRole(Long id, UserRole role);
    List<User> findByRacketOrRacketHistoryContaining(Racket racket, Racket historyRacket);

    // PESSIMISTIC_WRITE locks the user row and prevents concurrent coach bookings.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithLock(@Param("id") Long id);
}
