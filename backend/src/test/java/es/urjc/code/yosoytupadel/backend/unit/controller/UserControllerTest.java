package es.urjc.code.yosoytupadel.backend.unit.controller;

import es.urjc.code.yosoytupadel.backend.controller.UserController;
import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.dto.CoachDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserUpdateDTO;
import es.urjc.code.yosoytupadel.backend.entities.BookingStatus;
import es.urjc.code.yosoytupadel.backend.entities.BookingType;
import es.urjc.code.yosoytupadel.backend.entities.UserRole;
import es.urjc.code.yosoytupadel.backend.security.jwt.TokenType;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import es.urjc.code.yosoytupadel.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.mock.web.MockHttpServletRequest;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
    private BookingDTO bookingDTO;

    @BeforeEach
    void setUp() {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(new MockHttpServletRequest()));
        coachDTO = new CoachDTO(1L, "Rafa Nadal", 10.0, 25.0);
        userDTO = new UserDTO(1L, "Rafa Nadal", "Rafa", "rafa@example.com", "password", UserRole.USER, 3.0, null, 0);
        bookingDTO = new BookingDTO(1L, LocalDate.now().plusDays(1), LocalTime.of(10, 0),
                LocalTime.of(11, 0), 20.0, BookingType.MATCH, BookingStatus.PENDING, null, 1L, 2L, null);
    }

    @Test
    void getAllUsersReturnsUsers() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(userDTO));

        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Rafa Nadal"));

        verify(userService).getAllUsers();
    }

    @Test
    void getUserByIdReturnsUser() throws Exception {
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));

        mockMvc.perform(get("/api/v1/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("rafa@example.com"));

        verify(userService).getUserById(1L);
    }

    @Test
    void getUserByIdWhenMissingReturnsNotFound() throws Exception {
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/users/99"))
                .andExpect(status().isNotFound());

        verify(userService).getUserById(99L);
    }

    @Test
    void createUserReturnsCreatedAndLocation() throws Exception {
        when(userService.createUser(any(UserDTO.class))).thenReturn(userDTO);

        mockMvc.perform(post("/api/v1/users/new")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"id":1,"name":"Rafa Nadal","nickname":"Rafa","email":"rafa@example.com",
                                 "password":"password","role":"USER","skillLevel":3.0}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/v1/users/new/1"))
                .andExpect(jsonPath("$.name").value("Rafa Nadal"));

        verify(userService).createUser(any(UserDTO.class));
    }

    @Test
    void updateUserWhenOwnEmailChangesClearsAuthCookies() throws Exception {
        UserUpdateDTO updateDTO = new UserUpdateDTO("Rafael", null, "new@example.com");
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(userService.updateUser(eq(1L), any(UserUpdateDTO.class))).thenReturn(updateDTO);
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.of(userDTO));

        mockMvc.perform(put("/api/v1/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Rafael","email":"new@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Email-Changed", "true"))
                .andExpect(cookie().maxAge(TokenType.ACCESS.cookieName, 0))
                .andExpect(cookie().maxAge(TokenType.REFRESH.cookieName, 0))
                .andExpect(jsonPath("$.email").value("new@example.com"));

        verify(userService).updateUser(eq(1L), any(UserUpdateDTO.class));
    }

    @Test
    void updateUserWithoutOwnEmailChangeDoesNotClearCookies() throws Exception {
        UserUpdateDTO updateDTO = new UserUpdateDTO("Rafa", null, " RAFA@example.com ");
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(userService.updateUser(eq(1L), any(UserUpdateDTO.class))).thenReturn(updateDTO);
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.of(userDTO));

        mockMvc.perform(put("/api/v1/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Rafa","email":" RAFA@example.com "}
                                """))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("X-Email-Changed"));

        verify(userService).updateUser(eq(1L), any(UserUpdateDTO.class));
    }

    @Test
    void updateAnotherUserEmailDoesNotClearAuthenticatedUsersCookies() throws Exception {
        UserUpdateDTO updateDTO = new UserUpdateDTO(null, null, "new@example.com");
        UserDTO authenticatedUser = new UserDTO(2L, "Other user", "Other", "other@example.com",
                "password", UserRole.USER, 2.0, null, 0);
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(userService.updateUser(eq(1L), any(UserUpdateDTO.class))).thenReturn(updateDTO);
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.of(authenticatedUser));

        mockMvc.perform(put("/api/v1/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("X-Email-Changed"));
    }

    @Test
    void updateUserWhenUserDoesNotExistReturnsNotFound() throws Exception {
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/v1/users/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"New name\"}"))
                .andExpect(status().isNotFound());

        verify(userService, never()).updateUser(anyLong(), any(UserUpdateDTO.class));
    }

    @Test
    void updateSkillLevelReturnsUpdatedUser() throws Exception {
        when(userService.updateSkillLevel(1L, 0.5)).thenReturn(userDTO);

        mockMvc.perform(patch("/api/v1/users/1/skill-level").param("change", "0.5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skillLevel").value(3.0));

        verify(userService).updateSkillLevel(1L, 0.5);
    }

    @Test
    void rentRacketReturnsUpdatedUser() throws Exception {
        when(userService.rentRacket(1L, 7L)).thenReturn(userDTO);

        mockMvc.perform(patch("/api/v1/users/1/racket").param("racketId", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(userService).rentRacket(1L, 7L);
    }

    @Test
    void returnRacketReturnsUpdatedUser() throws Exception {
        when(userService.returnRacket(1L)).thenReturn(userDTO);

        mockMvc.perform(patch("/api/v1/users/1/racket-returned"))
                .andExpect(status().isOk());

        verify(userService).returnRacket(1L);
    }

    @Test
    void deleteUserReturnsDeletedUser() throws Exception {
        when(userService.deleteUser(1L)).thenReturn(userDTO);

        mockMvc.perform(delete("/api/v1/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(userService).deleteUser(1L);
    }

    @Test
    void getUserImageReturnsJpegResource() throws Exception {
        when(userService.getUserImage(1L)).thenReturn(new InputStreamResource(new ByteArrayInputStream(new byte[]{1, 2, 3})));

        mockMvc.perform(get("/api/v1/users/1/image"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(content().bytes(new byte[]{1, 2, 3}));

        verify(userService).getUserImage(1L);
    }

    @Test
    void replaceUserImageReturnsNoContent() throws Exception {
        MockMultipartFile image = new MockMultipartFile("imageFile", "profile.jpg",
                MediaType.IMAGE_JPEG_VALUE, new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/v1/users/1/image").file(image).with(request -> {
                    request.setMethod("PUT");
                    return request;
                }))
                .andExpect(status().isNoContent());

        verify(userService).replaceUserImage(eq(1L), any(ByteArrayInputStream.class), eq(3L));
    }

    @Test
    void deleteUserImageReturnsConfirmation() throws Exception {
        mockMvc.perform(delete("/api/v1/users/1/image"))
                .andExpect(status().isOk())
                .andExpect(content().string("User image deleted successfully"));

        verify(userService).deleteUserImage(1L);
    }

    @Test
    void getAuthenticatedUserReturnsUserWhenAuthenticated() throws Exception {
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.of(userDTO));

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getAuthenticatedUserReturnsUnauthorizedWhenMissing() throws Exception {
        when(userService.getAuthenticatedUserDto()).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(""));
    }

    @Test
    void getAllCoachsReturnsCoaches() throws Exception {
        when(userService.getAllCoachs()).thenReturn(List.of(coachDTO));

        mockMvc.perform(get("/api/v1/users/coachs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Rafa Nadal"))
                .andExpect(jsonPath("$[0].skillLevel").value(10.0))
                .andExpect(jsonPath("$[0].sessionPrice").value(25.0));

        verify(userService).getAllCoachs();
    }

    @Test
    void getCoachImageReturnsJpegResource() throws Exception {
        when(userService.getUserImage(1L)).thenReturn(new InputStreamResource(new ByteArrayInputStream(new byte[]{4, 5})));

        mockMvc.perform(get("/api/v1/users/coachs/1/image"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(content().bytes(new byte[]{4, 5}));

        verify(userService).getUserImage(1L);
    }

    @Test
    void getAllBookingsByUserReturnsBookings() throws Exception {
        when(bookingService.getAllBookingsByUserId(1L)).thenReturn(List.of(bookingDTO));

        mockMvc.perform(get("/api/v1/users/1/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(1));

        verify(bookingService).getAllBookingsByUserId(1L);
    }

    @Test
    void getUserMatchBookingsValidatesUserAndReturnsBookings() throws Exception {
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(bookingService.getMatchBookingsByUserId(1L)).thenReturn(List.of(bookingDTO));

        mockMvc.perform(get("/api/v1/users/1/bookings/matches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        verify(userService).getUserById(1L);
        verify(bookingService).getMatchBookingsByUserId(1L);
    }

    @Test
    void getUserMatchBookingsWhenUserDoesNotExistReturnsNotFound() throws Exception {
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/users/99/bookings/matches"))
                .andExpect(status().isNotFound());

        verify(bookingService, never()).getMatchBookingsByUserId(anyLong());
    }

    @Test
    void getUserTrainingBookingsValidatesUserAndReturnsBookings() throws Exception {
        when(userService.getUserById(1L)).thenReturn(Optional.of(userDTO));
        when(bookingService.getTrainingBookingsByUserId(1L)).thenReturn(List.of(bookingDTO));

        mockMvc.perform(get("/api/v1/users/1/bookings/trainings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        verify(userService).getUserById(1L);
        verify(bookingService).getTrainingBookingsByUserId(1L);
    }

    @Test
    void getUserTrainingBookingsWhenUserDoesNotExistReturnsNotFound() throws Exception {
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/users/99/bookings/trainings"))
                .andExpect(status().isNotFound());

        verify(bookingService, never()).getTrainingBookingsByUserId(anyLong());
    }
}
