package es.urjc.code.yosoytupadel.backend.service;

import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.List;
import java.util.NoSuchElementException;

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

    public Racket updateRacket(long id, Racket updatedRacket) {
        if (racketRepository.existsById(id)) {
            updatedRacket.setId(id);
            return racketRepository.save(updatedRacket);
        } else {
            throw new NoSuchElementException();
        }
    }

    public Racket deleteRacket(long id) {
        Racket racket = getRacketById(id);
        racketRepository.deleteById(id);
        return racket;
    }

    public InputStreamResource getRacketImage(long id) throws SQLException {
        Racket racket = racketRepository.findById(id).orElseThrow();
        if (racket.getImage() != null) {
            return new InputStreamResource(racket.getImage().getBinaryStream());
        } else {
            throw new NoSuchElementException();  }
    }

    public void createRacketImage(long id, URI location, InputStream inputStream, long size) {
        Racket racket = racketRepository.findById(id).orElseThrow();
        racket.setRacketImagePath(location.toString());
        racket.setImage(BlobProxy.generateProxy(inputStream, size));
        racketRepository.save(racket);
    }

    public void replaceRacketImage(long id, InputStream inputStream, long size) {
        Racket racket = racketRepository.findById(id).orElseThrow();
        racket.setImage(BlobProxy.generateProxy(inputStream, size));
        racketRepository.save(racket);
    }

    public void deleteRacketImage(long id) throws IOException, SQLException {
        Racket racket = racketRepository.findById(id).orElseThrow();
        if(racket.getImage() == null){
            throw new NoSuchElementException();
        }
        ClassPathResource imgFileDefault = new ClassPathResource("static/images/emptyImage.png");
        byte[] imageBytesDefault = Files.readAllBytes(imgFileDefault.getFile().toPath());
        Blob imageBlobDefault = new SerialBlob(imageBytesDefault);
        racket.setImage(imageBlobDefault);
        racketRepository.save(racket);
    }
}
