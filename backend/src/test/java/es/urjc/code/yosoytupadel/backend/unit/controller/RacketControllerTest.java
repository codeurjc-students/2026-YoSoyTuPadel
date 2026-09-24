package es.urjc.code.yosoytupadel.backend.unit.controller;

import es.urjc.code.yosoytupadel.backend.controller.RacketController;
import es.urjc.code.yosoytupadel.backend.dto.PreRacketDTO;
import es.urjc.code.yosoytupadel.backend.dto.RacketDTO;
import es.urjc.code.yosoytupadel.backend.service.RacketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;

import java.util.Arrays;
import java.util.Collections;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.*;


@WebMvcTest(
        controllers = RacketController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = { es.urjc.code.yosoytupadel.backend.security.WebSecurityConfig.class, es.urjc.code.yosoytupadel.backend.security.jwt.JwtRequestFilter.class }
        )
)
@AutoConfigureMockMvc(addFilters = false)
class RacketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RacketService racketService;


    private RacketDTO dto1;
    private RacketDTO dto2;

    private PreRacketDTO preDto1;
    private PreRacketDTO preDto2;

    @BeforeEach
    void setUp() {
        dto1 = new RacketDTO(1L, "Babolat", "Pure Aero", "Buen control", 14.5, 3);
        dto2 = new RacketDTO(2L, "Wilson", "Blade", "Mucha fuerza de golpeo", 15.0, 3);

        preDto1 = new PreRacketDTO(1L,"Babolat", "Pure Aero",3);
        preDto2 = new PreRacketDTO(2L, "Wilson", "Blade", 3);
    }

    @Test
    void getAllRackets_ShouldReturnListOfRackets() throws Exception {

        when(racketService.getAllRackets()).thenReturn(Arrays.asList(preDto1, preDto2));

        mockMvc.perform(get("/api/v1/rackets")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].brand").value("Babolat"))
                .andExpect(jsonPath("$[1].brand").value("Wilson"));

        verify(racketService, times(1)).getAllRackets();
    }

    @Test
    void getAllRackets_WhenServiceReturnsEmptyList_ShouldReturnEmptyList() throws Exception {

        when(racketService.getAllRackets()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/rackets")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(racketService, times(1)).getAllRackets();
    }
}
