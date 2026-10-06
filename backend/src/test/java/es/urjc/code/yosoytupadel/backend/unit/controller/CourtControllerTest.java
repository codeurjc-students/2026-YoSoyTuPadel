package es.urjc.code.yosoytupadel.backend.unit.controller;

import es.urjc.code.yosoytupadel.backend.controller.CourtController;
import es.urjc.code.yosoytupadel.backend.dto.CourtDTO;
import es.urjc.code.yosoytupadel.backend.dto.PreCourtDTO;
import es.urjc.code.yosoytupadel.backend.entities.CourtType;
import es.urjc.code.yosoytupadel.backend.entities.SurfaceType;
import es.urjc.code.yosoytupadel.backend.service.CourtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.hasSize;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.*;

@WebMvcTest(
        controllers = CourtController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = { es.urjc.code.yosoytupadel.backend.security.WebSecurityConfig.class, es.urjc.code.yosoytupadel.backend.security.jwt.JwtRequestFilter.class }
        )
)
@AutoConfigureMockMvc(addFilters = false)
class CourtControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private CourtService courtService;




    private CourtDTO dto1;
    private CourtDTO dto2;

    private PreCourtDTO preDto1;
    private PreCourtDTO preDto2;

    @BeforeEach
    void setUp() {

        dto1 = new CourtDTO( 1L,"Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, true);
        dto2 = new CourtDTO( 2L, "Coslada", 7.0, CourtType.INDOOR, SurfaceType.WALL, true);

        preDto1 = new PreCourtDTO(1L, "Alameda de Osuna", true);
        preDto2 = new PreCourtDTO(2L, "Coslada", true);
    }

    @Test
    void getCourts_ShouldReturnPagedCourtsUsingDefaultPageSize() throws Exception {

        when(courtService.getCourts(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(preDto1, preDto2), PageRequest.of(0, 10), 2));

        mockMvc.perform(get("/api/v1/courts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name").value("Alameda de Osuna"))
                .andExpect(jsonPath("$.content[0].isAvailable").value(true))
                .andExpect(jsonPath("$.content[0].courtPrice").doesNotExist())
                .andExpect(jsonPath("$.content[0].type").doesNotExist())
                .andExpect(jsonPath("$.content[1].name").value("Coslada"))
                .andExpect(jsonPath("$.totalElements").value(2));

        verify(courtService).getCourts(PageRequest.of(0, 10));
    }

    @Test
    void getCourts_WhenServiceReturnsEmptyPage_ShouldReturnEmptyContent() throws Exception {

        when(courtService.getCourts(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0));

        mockMvc.perform(get("/api/v1/courts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalPages").value(0));

        verify(courtService).getCourts(PageRequest.of(0, 10));
    }

    @Test
    void getCourts_ShouldAcceptPageAndSizeParameters() throws Exception {
        when(courtService.getCourts(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(preDto2), PageRequest.of(1, 5), 6));

        mockMvc.perform(get("/api/v1/courts").param("page", "1").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalPages").value(2));

        verify(courtService).getCourts(PageRequest.of(1, 5));
    }

    @Test
    void createCourt_ShouldReturnLocationHeader() throws Exception {
        CourtDTO newCourt = new CourtDTO(null, "Alameda de Osuna", 8.0, CourtType.INDOOR, SurfaceType.GLASS, true);
        when(courtService.createCourt(any(CourtDTO.class))).thenReturn(dto1);

        mockMvc.perform(post("/api/v1/courts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newCourt)))
                .andExpect(status().isCreated())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string(HttpHeaders.LOCATION, org.hamcrest.Matchers.endsWith("/api/v1/courts/1")));
    }

    @Test
    void getCourtById_ShouldReturnCourt() throws Exception {
        when(courtService.getCourtById(1L)).thenReturn(Optional.of(dto1));

        mockMvc.perform(get("/api/v1/courts/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alameda de Osuna"));
    }

    @Test
    void createCourt_ShouldReturnCreated() throws Exception {
        when(courtService.createCourt(any(CourtDTO.class))).thenReturn(dto1);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/courts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Alameda de Osuna\", \"pricePerHour\": 8.0, \"courtType\": \"INDOOR\", \"surfaceType\": \"GLASS\", \"isAvailable\": true}"))
                .andExpect(status().isCreated());
    }

    @Test
    void deleteCourt_ShouldReturnNoContent() throws Exception {
        when(courtService.deleteCourt(1L)).thenReturn(dto1);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/courts/1"))
                .andExpect(status().isOk());
    }
}
