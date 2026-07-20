package es.urjc.code.yosoytupadel.backend.service;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RacketService {
    @Autowired
    private final RacketRepository racketRepository;

    public List<Racket> getAllRackets() {
        return racketRepository.findAll();
    }

    public Racket getRacketById(Long id) {
        return racketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Racket not found"));
    }

    public Racket createRacket(Racket racket) {
        return racketRepository.save(racket);
    }
}
