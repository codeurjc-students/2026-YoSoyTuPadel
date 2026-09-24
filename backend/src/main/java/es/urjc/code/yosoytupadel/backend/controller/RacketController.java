package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.PreRacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.sql.SQLException;
import java.util.Collection;


import static org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest;

@RestController
@RequestMapping("/api/v1/rackets")
public class RacketController {

    @Autowired
    private RacketService racketService;


    @GetMapping("")
    public Collection<PreRacketDTO> getAllRackets() {
        return racketService.getAllRackets();
    }

    @GetMapping("/{id}")
    public RacketDTO getRacketById(@PathVariable long id) {
        return racketService.getRacketById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Racket not found"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("")
    public ResponseEntity<RacketDTO> createRacket(@RequestBody RacketDTO racketDTO) throws SQLException, IOException {
        RacketDTO responseDTO = racketService.createRacket(racketDTO);

        URI location = fromCurrentRequest().path("/{id}").buildAndExpand(responseDTO.id()).toUri();
        return ResponseEntity.created(location).body(responseDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public RacketDTO updateRacket(@PathVariable long id, @RequestBody RacketDTO updatedDTO) {

        return racketService.updateRacket(id, updatedDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public RacketDTO deleteRacket(@PathVariable long id) {

        return racketService.deleteRacket(id);
    }


    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/image")
    public ResponseEntity<Object> getRacketImage(@PathVariable long id) throws SQLException {

        Resource racketImage = racketService.getRacketImage(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg").body(racketImage);
    }


    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/image")
    public ResponseEntity<Object> replaceRacketImage(@PathVariable long id,
                                                       @RequestParam MultipartFile imageFile) throws IOException {

        racketService.replaceRacketImage(id, imageFile.getInputStream(), imageFile.getSize());
       return ResponseEntity.noContent().build();


    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/image")
    public ResponseEntity<Object> deletePostImage(@PathVariable long id) throws IOException, SQLException {

        racketService.deleteRacketImage(id);
        return ResponseEntity.noContent().build();


    }

}