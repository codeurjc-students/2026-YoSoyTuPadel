package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketMapper;
import es.urjc.code.yosoytupadel.backend.entities.Racket;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.sql.SQLException;
import java.util.Collection;
import java.util.List;

import static org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest;

@RestController
@RequestMapping("/api/v1/rackets")
@CrossOrigin(origins = "http://localhost:5173")
public class RacketController {

    @Autowired
    private RacketService racketService;

    @Autowired
    private RacketMapper mapper;

    @GetMapping("")
    public Collection<RacketDTO> getAllRackets() {
        return mapper.toDTOs(racketService.getAllRackets());
    }

    @GetMapping("/{id}")
    public RacketDTO getRacketById(@PathVariable long id) {
        return mapper.toDTO(racketService.getRacketById(id));
    }

    @PostMapping("")
    public ResponseEntity<RacketDTO> createRacket(@RequestBody RacketDTO racketDTO) {
        Racket racket = mapper.toDomain(racketDTO);
        racket = racketService.createRacket(racket);
        RacketDTO responseDTO = mapper.toDTO(racket);

        URI location = fromCurrentRequest().path("/{id}").buildAndExpand(responseDTO.id()).toUri();
        return ResponseEntity.created(location).body(responseDTO);
    }

    @PutMapping("/{id}")
    public RacketDTO updateRacket(@PathVariable long id, @RequestBody RacketDTO updatedDTO) {
        Racket updatedRacket = mapper.toDomain(updatedDTO);
        return mapper.toDTO(racketService.updateRacket(id, updatedRacket));
    }

    @DeleteMapping("/{id}")
    public RacketDTO deleteRacket(@PathVariable long id) {
        return mapper.toDTO(racketService.deleteRacket(id));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<Object> getRacketImage(@PathVariable long id) throws SQLException {
        Resource racketImage = racketService.getRacketImage(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg").body(racketImage);
    }


//    @PostMapping("/{id}/image")
//    public ResponseEntity<Object> createRacketImage(@PathVariable long id,
//                                                      @RequestParam MultipartFile imageFile) throws IOException {
//        URI location = fromCurrentRequest().build().toUri();
//        racketService.createRacketImage(id, location, imageFile.getInputStream(), imageFile.getSize());
//        return ResponseEntity.created(location).build();
//    }

    @PutMapping("/{id}/image")
    public ResponseEntity<Object> replaceRacketImage(@PathVariable long id,
                                                       @RequestParam MultipartFile imageFile) throws IOException {
            racketService.replaceRacketImage(id, imageFile.getInputStream(), imageFile.getSize());
           return ResponseEntity.noContent().build();


    }

    @DeleteMapping("/{id}/image")
    public ResponseEntity<Object> deletePostImage(@PathVariable long id) throws IOException, SQLException {

            racketService.deleteRacketImage(id);
            return ResponseEntity.noContent().build();


    }

}