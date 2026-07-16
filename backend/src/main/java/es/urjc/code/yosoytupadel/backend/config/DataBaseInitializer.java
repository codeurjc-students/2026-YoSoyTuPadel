package es.urjc.code.yosoytupadel.backend.config;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataBaseInitializer implements CommandLineRunner {

    private final RacketRepository racketRepository;

    public DataBaseInitializer(RacketRepository racketRepository) {
        this.racketRepository = racketRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (racketRepository.count() == 0) {

            Racket racket1 = new Racket(
                    null,
                    "Nox",
                    "ML10 Pro Cup",
                    "La mítica pala de Miguel Lamperti. Control absoluto y gran salida de bola.",
                    5.0
            );

            Racket racket2 = new Racket(
                    null,
                    "Bullpadel",
                    "Vertex 04",
                    "Pala de potencia pura para jugadores agresivos. Superficie rugosa.",
                    7.5
            );

            Racket racket3 = new Racket(
                    null,
                    "Adidas",
                    "Metalbone HRD",
                    "La pala de Ale Galán. Personalización de pesos y máxima rigidez.",
                    8.0
            );

            Racket racket4 = new Racket(
                    null,
                    "Head",
                    "Extreme Pro",
                    "Pala de potencia con formato diamante. Actualmente en reparación.",
                    6.0
            );

            racketRepository.saveAll(List.of(racket1, racket2, racket3, racket4));


        }
    }
}