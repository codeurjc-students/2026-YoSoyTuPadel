package es.urjc.code.yosoytupadel.backend.repository;

import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import es.urjc.code.yosoytupadel.backend.entities.User;

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
}
