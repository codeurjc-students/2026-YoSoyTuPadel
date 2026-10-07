package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.PreRacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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


@RestController
@RequestMapping("/api/v1/rackets")
public class RacketController {

    @Autowired
    private RacketService racketService;

    @Operation(summary = "Get a paginated list of rackets")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the rackets", content = { @Content(mediaType = "application/json") })
    })
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("")
    public Page<PreRacketDTO> getAllRackets(@PageableDefault(size = 10) Pageable pageable) {
        return racketService.getRackets(pageable);
    }

    @Operation(summary = "Get a racket by its id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the racket", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = RacketDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid id supplied", content = @Content),
            @ApiResponse(responseCode = "404", description = "Racket not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/{id}")
    public RacketDTO getRacketById(@PathVariable long id) {
        return racketService.getRacketById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Racket not found"));
    }

    @Operation(summary = "Create a new racket (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Racket created successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = RacketDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid racket data supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content)
    })
    @ResponseStatus(HttpStatus.CREATED)
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

    @Operation(summary = "Update an existing racket (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Racket updated successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = RacketDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid racket data supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "Racket not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public RacketDTO updateRacket(@PathVariable long id, @RequestBody RacketDTO updatedDTO) {

        return racketService.updateRacket(id, updatedDTO);
    }

    @Operation(summary = "Delete a racket by its id (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Racket deleted successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = RacketDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "Racket not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public RacketDTO deleteRacket(@PathVariable long id) {

        return racketService.deleteRacket(id);
    }



    @Operation(summary = "Get the image of a racket")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the image", content = { @Content(mediaType = "application/octet-stream") }),
            @ApiResponse(responseCode = "404", description = "Image or racket not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
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


    @Operation(summary = "Replace or upload a racket image (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Image updated successfully", content = @Content),
            @ApiResponse(responseCode = "400", description = "Invalid file supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "Racket not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/image")
    public ResponseEntity<Object> replaceRacketImage(@PathVariable long id,
                                                       @RequestParam MultipartFile imageFile) throws IOException {

        racketService.replaceRacketImage(id, imageFile.getInputStream(), imageFile.getSize());
       return ResponseEntity.noContent().build();


    }

    @Operation(summary = "Delete the image of a racket (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Image deleted successfully", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "Racket or image not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/image")
    public ResponseEntity<Object> deletePostImage(@PathVariable long id) throws IOException, SQLException {

        racketService.deleteRacketImage(id);
        return ResponseEntity.noContent().build();


    }

}