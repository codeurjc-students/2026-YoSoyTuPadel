package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.CourtDTO;
import es.urjc.code.yosoytupadel.backend.dto.CourtMapper;
import es.urjc.code.yosoytupadel.backend.entities.Court;
import es.urjc.code.yosoytupadel.backend.service.CourtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Collection;

import static org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest;


@RestController
@RequestMapping("/api/v1/courts")
public class CourtController {

    @Autowired
    private CourtService courtService;

    @Autowired
    private CourtMapper mapper;

    @GetMapping("")
    public Collection<CourtDTO> getCourts() {
        return mapper.toDTOs(courtService.getAllCourts());
    }

    @GetMapping("/{id}")
    public CourtDTO getCourt(@PathVariable long id) {
        return mapper.toDTO(courtService.getCourtById(id));
    }

    @PostMapping("")
    public ResponseEntity<CourtDTO> createCourt(@RequestBody CourtDTO courtDTO) {
        Court court = mapper.toDomain(courtDTO);
        court = courtService.createCourt(court);
        CourtDTO responseDTO = mapper.toDTO(court);

        URI location = fromCurrentRequest().path("/{id}").buildAndExpand(responseDTO.id()).toUri();
        return ResponseEntity.created(location).body(responseDTO);
    }


    @PatchMapping("/{id}/price")
    public CourtDTO updatePrice(@PathVariable long id, @RequestParam Double newPrice) {
        return mapper.toDTO(courtService.updatePrice(id, newPrice));
    }

    @PutMapping("/{id}")
    public CourtDTO updateCourt(@PathVariable long id, @RequestBody CourtDTO courtDTO) {
        Court updatedCourt = mapper.toDomain(courtDTO);
        return mapper.toDTO(courtService.updateCourt(id, updatedCourt));
    }

    @DeleteMapping("/{id}")
    public CourtDTO deleteCourt(@PathVariable long id) {
        return mapper.toDTO(courtService.deleteCourt(id));
    }
}
