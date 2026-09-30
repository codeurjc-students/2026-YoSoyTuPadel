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

        preDto1 = new PreCourtDTO(1L,"Alameda de Osuna", true);
        preDto2 = new PreCourtDTO(2L, "Coslada", true );
    }

    @Test
    void getAllCourts_ShouldReturnListOfCourts() throws Exception {

        when(courtService.getAllCourts()).thenReturn(Arrays.asList(preDto1, preDto2));

        mockMvc.perform(get("/api/v1/courts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Alameda de Osuna"))
                .andExpect(jsonPath("$[1].name").value("Coslada"));

        verify(courtService, times(1)).getAllCourts();
    }

    @Test
    void getAllCourts_WhenServiceReturnsEmptyList_ShouldReturnEmptyList() throws Exception {

        when(courtService.getAllCourts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/courts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(courtService, times(1)).getAllCourts();
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
}
