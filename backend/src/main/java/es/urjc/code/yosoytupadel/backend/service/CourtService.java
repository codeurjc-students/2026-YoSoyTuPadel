package es.urjc.code.yosoytupadel.backend.service;

import es.urjc.code.yosoytupadel.backend.entities.Court;
import es.urjc.code.yosoytupadel.backend.repository.CourtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CourtService {

    @Autowired
    private CourtRepository courtRepository;

    public Collection<Court> getAllCourts() {
        return courtRepository.findAll();
    }

    public Court getCourtById(long id) {
        return courtRepository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    public Court createCourt(Court court) {
        court.setIsAvailable(true);
        court.setQualification(0.0);
        return courtRepository.save(court);
    }


    public Court updatePrice(long id, Double newPrice) {
        Court court = getCourtById(id);
        court.setCourtPrice(newPrice);
        return courtRepository.save(court);
    }

    public Court updateCourt(long id, Court updatedCourt) {
        Court existing = getCourtById(id);
        updatedCourt.setId(existing.getId());
        return courtRepository.save(updatedCourt);
    }

    public Court deleteCourt(long id) {
        Court court = getCourtById(id);
        courtRepository.deleteById(id);
        return court;
    }
}
