package es.urjc.code.yosoytupadel.backend.service;

import es.urjc.code.yosoytupadel.backend.dto.CourtDTO;
import es.urjc.code.yosoytupadel.backend.dto.CourtMapper;
import es.urjc.code.yosoytupadel.backend.dto.PreCourtDTO;
import es.urjc.code.yosoytupadel.backend.entities.Court;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class CourtService {

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private CourtMapper mapper;

    public Collection<PreCourtDTO> getAllCourts() {
        return mapper.toPreDTOs(courtRepository.findAll());
    }

    public Optional<CourtDTO> getCourtById(long id) {
        return courtRepository.findById(id).map(mapper::toDTO);
    }

    public CourtDTO createCourt(CourtDTO courtDTO) {
        Court court = mapper.toDomain(courtDTO);
        court.setIsAvailable(true);
        Court savedCourt = courtRepository.save(court);
        return mapper.toDTO(savedCourt);
    }


    public CourtDTO updatePrice(long id, Double newPrice) {
        Court court = courtRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Court not found"));

        court.setCourtPrice(newPrice);
        Court savedCourt = courtRepository.save(court);
        return mapper.toDTO(savedCourt);
    }

    public CourtDTO updateCourt(long id, CourtDTO updatedDTO) {
        Court existing = courtRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Court not found"));

        Court updatedCourt = mapper.toDomain(updatedDTO);
        updatedCourt.setId(existing.getId());

        Court savedCourt = courtRepository.save(updatedCourt);
        return mapper.toDTO(savedCourt);
    }

    public CourtDTO deleteCourt(long id) {
        Court court = courtRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Court not found"));

        courtRepository.deleteById(id);
        return mapper.toDTO(court);
    }
}
