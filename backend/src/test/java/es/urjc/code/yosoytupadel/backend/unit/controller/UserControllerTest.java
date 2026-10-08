package es.urjc.code.yosoytupadel.backend.unit.controller;

import es.urjc.code.yosoytupadel.backend.controller.UserController;
import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserUpdateDTO;
import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.entities.BookingType;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import es.urjc.code.yosoytupadel.backend.service.UserService;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private BookingService bookingService;

    private CoachDTO coachDTO;
    private UserDTO userDTO;

    @BeforeEach
    void setUp() {
        coachDTO = new CoachDTO(1L, "Rafa Nadal", 2, 25.0);

        userDTO = mock(UserDTO.class);
    }

    @Test
    void getAllCoachs_ShouldReturnListOfCoaches() throws Exception {
        when(userService.getCoachs(any())).thenReturn(new PageImpl<>(Arrays.asList(coachDTO), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/users/coaches")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Rafa Nadal"))
                .andExpect(jsonPath("$.content[0].skillLevel").value(2))
                .andExpect(jsonPath("$.content[0].sessionPrice").value(25.0))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(userService).getCoachs(PageRequest.of(0, 10));
    }

    @Test
    void getCoachById_ShouldReturnCoachDetails() throws Exception {
        when(userService.getCoachById(1L)).thenReturn(Optional.of(coachDTO));

        mockMvc.perform(get("/api/v1/users/coaches/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Rafa Nadal"))
                .andExpect(jsonPath("$.sessionPrice").value(25.0));
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

    @Test
    void createUser_ShouldReturnLocationHeader() throws Exception {
        UserDTO newUser = new UserDTO(null, "Test User", "test-user", "test@example.com",
                "password", null, null, null, 0, java.util.List.of());
        UserDTO savedUser = new UserDTO(5L, "Test User", "test-user", "test@example.com",
                null, null, null, null, 0, java.util.List.of());
        when(userService.createUser(any(UserDTO.class))).thenReturn(savedUser);

        mockMvc.perform(post("/api/v1/users/new")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isCreated())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string(HttpHeaders.LOCATION, org.hamcrest.Matchers.endsWith("/api/v1/users/5")));
    }

    @Test
    void getUserBookings_ShouldAcceptTypeAsQueryParameter() throws Exception {
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(bookingService.getMatchBookingsByUserId(1L)).thenReturn(java.util.List.<BookingDTO>of());

        mockMvc.perform(get("/api/v1/users/1/bookings").param("type", BookingType.MATCH.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(bookingService).getMatchBookingsByUserId(1L);
    }

    @Test
    void rentRacket_ShouldUseUserAndRacketPathVariables() throws Exception {
        when(userService.rentRacket(1L, 2L)).thenReturn(userDTO);

        mockMvc.perform(patch("/api/v1/users/1/racket/2"))
                .andExpect(status().isOk());

        verify(userService).rentRacket(1L, 2L);
    }

    @Test
    void returnRacket_ShouldDeleteRacketAssignment() throws Exception {
        when(userService.returnRacket(1L)).thenReturn(userDTO);

        mockMvc.perform(delete("/api/v1/users/1/racket"))
                .andExpect(status().isOk());

        verify(userService).returnRacket(1L);
    }

    @Test
    void getCoachById_WhenNotFound_ShouldReturn404() throws Exception {
        // Given
        when(userService.getCoachById(99L)).thenReturn(Optional.empty());

        // When / Then
        mockMvc.perform(get("/api/v1/users/coaches/99"))
                .andExpect(status().isNotFound());
        verify(userService).getCoachById(99L);
    }

    @Test
    void getUserBookings_WhenTrainingType_ShouldUseTrainingService() throws Exception {
        // Given
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(bookingService.getTrainingBookingsByUserId(1L)).thenReturn(java.util.List.of());

        // When / Then
        mockMvc.perform(get("/api/v1/users/1/bookings").param("type", BookingType.TRAINING.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        verify(bookingService).getTrainingBookingsByUserId(1L);
        verify(bookingService, never()).getAllBookingsByUserId(1L);
    }

    @Test
    void getUserBookings_WithoutType_ShouldUseAllBookingsService() throws Exception {
        // Given
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(bookingService.getAllBookingsByUserId(1L)).thenReturn(java.util.List.of());

        // When / Then
        mockMvc.perform(get("/api/v1/users/1/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        verify(bookingService).getAllBookingsByUserId(1L);
        verify(bookingService, never()).getMatchBookingsByUserId(1L);
    }

    @Test
    void getUserBookings_WhenUserNotFound_ShouldReturn404WithoutLoadingBookings() throws Exception {
        // Given
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        // When / Then
        mockMvc.perform(get("/api/v1/users/99/bookings"))
                .andExpect(status().isNotFound());
        verify(bookingService, never()).getAllBookingsByUserId(anyLong());
    }

    @Test
    void getAuthenticatedUser_WhenNotAuthenticated_ShouldReturn401() throws Exception {
        // Given
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.empty());

        // When / Then
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());
        verify(userService).getAuthenticatedUserDto();
    }

    @Test
    void getAuthenticatedUser_WhenAuthenticated_ShouldReturnUser() throws Exception {
        // Given
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.of(userDTO));

        // When / Then
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk());
    }

    @Test
    void getUserImage_ShouldReturnJpeg() throws Exception {
        // Given
        when(userService.getUserImage(1L))
                .thenReturn(new org.springframework.core.io.InputStreamResource(
                        new java.io.ByteArrayInputStream(new byte[]{1, 2, 3})));

        // When / Then
        mockMvc.perform(get("/api/v1/users/1/image"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string(HttpHeaders.CONTENT_TYPE, "image/jpeg"));
        verify(userService).getUserImage(1L);
    }

    @Test
    void replaceUserImage_ShouldReturnNoContent() throws Exception {
        // Given
        org.springframework.mock.web.MockMultipartFile image =
                new org.springframework.mock.web.MockMultipartFile("imageFile", "profile.jpg",
                        MediaType.IMAGE_JPEG_VALUE, new byte[]{1, 2, 3});

        // When / Then
        mockMvc.perform(multipart("/api/v1/users/1/image").file(image).with(request -> {
                    request.setMethod("PUT");
                    return request;
                }))
                .andExpect(status().isNoContent());
        verify(userService).replaceUserImage(eq(1L), any(), eq(3L));
    }

    @Test
    void deleteUserImage_ShouldReturnSuccessMessage() throws Exception {
        // Given
        doNothing().when(userService).deleteUserImage(1L);

        // When / Then
        mockMvc.perform(delete("/api/v1/users/1/image"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("User image deleted successfully"));
        verify(userService).deleteUserImage(1L);
    }

    @Test
    void updateSkillLevel_ShouldDelegateChange() throws Exception {
        // Given
        when(userService.updateSkillLevel(1L, 0.5)).thenReturn(userDTO);

        // When / Then
        mockMvc.perform(patch("/api/v1/users/1/skill-level").param("change", "0.5"))
                .andExpect(status().isOk());
        verify(userService).updateSkillLevel(1L, 0.5);
    }

    @Test
    void deleteUser_ShouldDelegateToService() throws Exception {
        // Given
        when(userService.deleteUser(1L)).thenReturn(userDTO);

        // When / Then
        mockMvc.perform(delete("/api/v1/users/1"))
                .andExpect(status().isOk());
        verify(userService).deleteUser(1L);
    }

    @Test
    void updateUser_WhenUserDoesNotExist_ShouldReturn404() throws Exception {
        // Given
        when(userService.getUserById(99L)).thenReturn(Optional.empty());
        UserUpdateDTO update = new UserUpdateDTO("Name", "nick", "new@example.com", 20.0);

        // When / Then
        mockMvc.perform(put("/api/v1/users/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
        verify(userService, never()).updateUser(anyLong(), any());
    }

    @Test
    void getAllUsers_ShouldReturnUsers() throws Exception {
        // Given
        when(userService.getAllUsers()).thenReturn(java.util.List.of(userDTO));

        // When / Then
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
        verify(userService).getAllUsers();
    }

    @Test
    void updateUser_WhenEmailChangesForAuthenticatedUser_ShouldClearTokens() throws Exception {
        // Given
        UserUpdateDTO update = new UserUpdateDTO("Name", "nick", "new@example.com", 20.0);
        UserUpdateDTO saved = new UserUpdateDTO("Name", "nick", "new@example.com", 20.0);
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(userDTO.email()).thenReturn("old@example.com");
        when(userService.updateUser(eq(1L), any(UserUpdateDTO.class))).thenReturn(saved);
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.of(userDTO));
        when(userDTO.id()).thenReturn(1L);

        // When / Then
        mockMvc.perform(put("/api/v1/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string("X-Email-Changed", "true"));
        verify(userService).updateUser(eq(1L), any(UserUpdateDTO.class));
    }

    @Test
    void getCoachImage_ShouldReturnJpeg() throws Exception {
        // Given
        when(userService.getUserImage(1L))
                .thenReturn(new org.springframework.core.io.InputStreamResource(
                        new java.io.ByteArrayInputStream(new byte[]{1, 2, 3})));

        // When / Then
        mockMvc.perform(get("/api/v1/users/coaches/1/image"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string(HttpHeaders.CONTENT_TYPE, "image/jpeg"));
        verify(userService).getUserImage(1L);
    }
}