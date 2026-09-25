package es.urjc.code.yosoytupadel.backend.repository;

import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import es.urjc.code.yosoytupadel.backend.entities.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);
    boolean existsByEmail(String email);
    List<User> findByRole(UserRole role);
}
