package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.PreRacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collection;


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

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(responseDTO.id())
                .toUri();
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


    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getRacketImage(@PathVariable long id) throws SQLException, IOException {

        Resource racketImage = racketService.getRacketImage(id);
        byte[] imageBytes = racketImage.getContentAsByteArray();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, getImageMediaType(imageBytes))
                .body(imageBytes);
    }

    private String getImageMediaType(byte[] image) {
        if (image.length >= 8 && Arrays.equals(Arrays.copyOf(image, 8),
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A})) {
            return MediaType.IMAGE_PNG_VALUE;
        }
        if (image.length >= 3 && (image[0] & 0xFF) == 0xFF
                && (image[1] & 0xFF) == 0xD8 && (image[2] & 0xFF) == 0xFF) {
            return MediaType.IMAGE_JPEG_VALUE;
        }
        if (image.length >= 6 && (new String(image, 0, 6, java.nio.charset.StandardCharsets.US_ASCII)
                .startsWith("GIF87a") || new String(image, 0, 6, java.nio.charset.StandardCharsets.US_ASCII)
                .startsWith("GIF89a"))) {
            return MediaType.IMAGE_GIF_VALUE;
        }
        if (image.length >= 12 && new String(image, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")
                && new String(image, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP")) {
            return "image/webp";
        }
        return MediaType.APPLICATION_OCTET_STREAM_VALUE;
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