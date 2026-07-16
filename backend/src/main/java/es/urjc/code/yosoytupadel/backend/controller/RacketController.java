package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rackets")
@CrossOrigin(origins = "http://localhost:5173")
public class RacketController {

    private final RacketRepository racketRepository;

    public RacketController(RacketRepository racketRepository) {
        this.racketRepository = racketRepository;
    }

    @GetMapping
    public List<Racket> getAllRackets() {
        return racketRepository.findAll();
    }
}