package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.CourtDTO;
import es.urjc.code.yosoytupadel.backend.dto.PreCourtDTO;
import es.urjc.code.yosoytupadel.backend.service.CourtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.Collection;

import static org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest;


@RestController
@RequestMapping("/api/v1/courts")
public class CourtController {

    @Autowired
    private CourtService courtService;

    @GetMapping("")
    public Collection<PreCourtDTO> getCourts() {
        return courtService.getAllCourts();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public CourtDTO getCourt(@PathVariable long id) {
        return courtService.getCourtById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Court not found"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("")
    public ResponseEntity<CourtDTO> createCourt(@RequestBody CourtDTO courtDTO) {
        CourtDTO responseDTO = courtService.createCourt(courtDTO);

        URI location = fromCurrentRequest().path("/{id}").buildAndExpand(responseDTO.id()).toUri();
        return ResponseEntity.created(location).body(responseDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/price")
    public CourtDTO updatePrice(@PathVariable long id, @RequestParam Double newPrice) {
        return courtService.updatePrice(id, newPrice);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public CourtDTO updateCourt(@PathVariable long id, @RequestBody CourtDTO courtDTO) {
        return courtService.updateCourt(id, courtDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public CourtDTO deleteCourt(@PathVariable long id) {
        return courtService.deleteCourt(id);
    }
}
