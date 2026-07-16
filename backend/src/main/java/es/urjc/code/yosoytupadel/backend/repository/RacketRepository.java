package es.urjc.code.yosoytupadel.backend.repository;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RacketRepository extends JpaRepository<Racket, Long> {
}