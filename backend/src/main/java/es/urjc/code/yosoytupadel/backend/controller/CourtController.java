package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.CourtDTO;
import es.urjc.code.yosoytupadel.backend.dto.PreCourtDTO;
import es.urjc.code.yosoytupadel.backend.service.CourtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
@RestController
@RequestMapping("/api/v1/courts")
public class CourtController {

    @Autowired
    private CourtService courtService;

    @Operation(summary = "Get a paginated list of courts")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the courts", content = { @Content(mediaType = "application/json") })
    })
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("")
    public Page<PreCourtDTO> getCourts(@PageableDefault(size = 10) Pageable pageable) {
        return courtService.getCourts(pageable);
    }

    @Operation(summary = "Get a court by its id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the court", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CourtDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid id supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Court not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public CourtDTO getCourt(@PathVariable long id) {
        return courtService.getCourtById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Court not found"));
    }

    @Operation(summary = "Create a new court (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Court created successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CourtDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid court data supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content)
    })
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("")
    public ResponseEntity<CourtDTO> createCourt(@RequestBody CourtDTO courtDTO) {
        CourtDTO responseDTO = courtService.createCourt(courtDTO);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(responseDTO.id())
                .toUri();
        return ResponseEntity.created(location).body(responseDTO);
    }

    @Operation(summary = "Update the price of a court (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Court price updated successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CourtDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid price supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "Court not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/price")
    public CourtDTO updatePrice(@PathVariable long id, @RequestParam Double newPrice) {
        return courtService.updatePrice(id, newPrice);
    }

    @Operation(summary = "Update a court's details (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Court updated successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CourtDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid court data supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "Court not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public CourtDTO updateCourt(@PathVariable long id, @RequestBody CourtDTO courtDTO) {
        return courtService.updateCourt(id, courtDTO);
    }

    @Operation(summary = "Delete a court (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Court deleted successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CourtDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "Court not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public CourtDTO deleteCourt(@PathVariable long id) {
        return courtService.deleteCourt(id);
    }
}
