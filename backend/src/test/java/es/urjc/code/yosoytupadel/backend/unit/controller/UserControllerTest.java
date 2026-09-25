package es.urjc.code.yosoytupadel.backend.unit.controller;

import es.urjc.code.yosoytupadel.backend.controller.UserController;
import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import es.urjc.code.yosoytupadel.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = UserController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {
                        es.urjc.code.yosoytupadel.backend.security.WebSecurityConfig.class,
                        es.urjc.code.yosoytupadel.backend.security.jwt.JwtRequestFilter.class
                }
        )
)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private BookingService bookingService;

    private CoachDTO coachDTO;
    private UserDTO userDTO;

    @BeforeEach
    void setUp() {
        coachDTO = new CoachDTO(1L, "Rafa Nadal", 10.0, 25.0);

        userDTO = mock(UserDTO.class);
    }

    @Test
    void getAllCoachs_ShouldReturnListOfCoaches() throws Exception {
        when(userService.getAllCoachs()).thenReturn(Arrays.asList(coachDTO));

        mockMvc.perform(get("/api/v1/users/coachs")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Rafa Nadal"))
                .andExpect(jsonPath("$[0].skillLevel").value(10.0))
                .andExpect(jsonPath("$[0].sessionPrice").value(25.0));

        verify(userService, times(1)).getAllCoachs();
    }

    @Test
    void getUserById_ShouldReturnUser() throws Exception {
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));

        mockMvc.perform(get("/api/v1/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(userService, times(1)).getUserById(1L);
    }

    @Test
    void getUserById_WhenNotFound_ShouldReturn404() throws Exception {
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/users/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(userService, times(1)).getUserById(99L);
    }
}