package es.urjc.code.yosoytupadel.backend.service;

import es.urjc.code.yosoytupadel.backend.dto.PreRacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketMapper;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.repository.RacketRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.Collection;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RacketService {
    @Autowired
    private  RacketRepository racketRepository;

    @Autowired
    private RacketMapper mapper;

    public Collection<PreRacketDTO> getAllRackets() {
        return mapper.toPreDTOs(racketRepository.findAll());
    }

    public Optional<RacketDTO> getRacketById(long id) {
        return racketRepository.findById(id).map(mapper::toDTO);
    }

    public RacketDTO createRacket(RacketDTO racketDTO) throws IOException, SQLException {
        Racket racket = mapper.toDomain(racketDTO);
        ClassPathResource imgFileDefault = new ClassPathResource("static/images/pala-vacia.png");
        byte[] imageBytesDefault = Files.readAllBytes(imgFileDefault.getFile().toPath());
        Blob imageBlobDefault = new SerialBlob(imageBytesDefault);
        racket.setImage(imageBlobDefault);
        Racket savedRacket = racketRepository.save(racket);
        return mapper.toDTO(savedRacket);
    }

    public Racket createRacket(Racket racket) throws SQLException, IOException {

        ClassPathResource imgFileDefault = new ClassPathResource("static/images/pala-vacia.png");
        byte[] imageBytesDefault = Files.readAllBytes(imgFileDefault.getFile().toPath());
        Blob imageBlobDefault = new SerialBlob(imageBytesDefault);
        racket.setImage(imageBlobDefault);

        return racketRepository.save(racket);
    }

    public RacketDTO updateRacket(long id, RacketDTO updatedDTO) {

        Racket existingRacket = racketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Racket not found"));

        Racket racketToUpdate = mapper.toDomain(updatedDTO);
        racketToUpdate.setId(existingRacket.getId());

        Racket savedRacket = racketRepository.save(racketToUpdate);
        return mapper.toDTO(savedRacket);
    }

    public RacketDTO deleteRacket(long id) {
        Racket racket = racketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Racket not found"));

        racketRepository.delete(racket);
        return mapper.toDTO(racket);
    }


    public InputStreamResource getRacketImage(long id) throws SQLException {
        Racket racket = racketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Racket not found"));
        if (racket.getImage() != null) {
            return new InputStreamResource(racket.getImage().getBinaryStream());
        } else {
            throw new NoSuchElementException();  }
    }


    public void replaceRacketImage(long id, InputStream inputStream, long size) {
        Racket racket = racketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Racket not found"));
        racket.setImage(BlobProxy.generateProxy(inputStream, size));
        racketRepository.save(racket);
    }

    public void deleteRacketImage(long id) throws IOException, SQLException {
        Racket racket = racketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Racket not found"));
        if(racket.getImage() == null){
            throw new NoSuchElementException();
        }
        ClassPathResource imgFileDefault = new ClassPathResource("static/images/pala-vacia.png");
        byte[] imageBytesDefault = Files.readAllBytes(imgFileDefault.getFile().toPath());
        Blob imageBlobDefault = new SerialBlob(imageBytesDefault);
        racket.setImage(imageBlobDefault);
        racketRepository.save(racket);
    }
}
