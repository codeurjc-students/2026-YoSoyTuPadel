package es.urjc.code.yosoytupadel.backend.unit.controller;

import es.urjc.code.yosoytupadel.backend.controller.BookingController;
import es.urjc.code.yosoytupadel.backend.dto.BookingDTO;
import es.urjc.code.yosoytupadel.backend.entities.BookingStatus;
import es.urjc.code.yosoytupadel.backend.entities.BookingType;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.hasSize;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.*;

@WebMvcTest(
        controllers = BookingController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = { es.urjc.code.yosoytupadel.backend.security.WebSecurityConfig.class, es.urjc.code.yosoytupadel.backend.security.jwt.JwtRequestFilter.class }
        )
)
@AutoConfigureMockMvc(addFilters = false)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BookingService bookingService;

    private BookingDTO dto1;
    private BookingDTO dto2;

    @BeforeEach
    void setUp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        dto1 = mock(BookingDTO.class);
        dto2 = mock(BookingDTO.class);
    }

    @Test
    void getAllBookings_ShouldReturnList() throws Exception {
        when(bookingService.getAllBookings()).thenReturn(Arrays.asList(dto1, dto2));

        mockMvc.perform(get("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        verify(bookingService, times(1)).getAllBookings();
    }

    @Test
    void getAllBookings_WhenEmpty_ShouldReturnEmptyList() throws Exception {
        when(bookingService.getAllBookings()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(bookingService, times(1)).getAllBookings();
    }

    @Test
    void getBooking_ShouldReturnBooking() throws Exception {
        when(bookingService.getBookingById(1L)).thenReturn(Optional.of(dto1));

        mockMvc.perform(get("/api/v1/bookings/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(bookingService, times(1)).getBookingById(1L);
    }

    @Test
    void getBooking_WhenNotFound_ShouldReturn404() throws Exception {
        when(bookingService.getBookingById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/bookings/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(bookingService, times(1)).getBookingById(99L);
    }

    @Test
    void cancelBooking_ShouldReturnOk() throws Exception {
        BookingDTO cancelledDTO = new BookingDTO(1L, LocalDate.now().plusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0),
                20.0, BookingType.MATCH, BookingStatus.CANCELLED, null, 2L, 1L, null);
        when(bookingService.cancelBooking(1L)).thenReturn(cancelledDTO);

        mockMvc.perform(patch("/api/v1/bookings/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(bookingService, times(1)).cancelBooking(1L);
    }


}