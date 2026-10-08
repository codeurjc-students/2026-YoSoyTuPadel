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
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.io.ByteArrayInputStream;
import java.util.HexFormat;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

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

        when(racketService.getRackets(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(preDto1, preDto2), PageRequest.of(0, 10), 2));

        mockMvc.perform(get("/api/v1/rackets")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].brand").value("Babolat"))
                .andExpect(jsonPath("$.content[1].brand").value("Wilson"))
                .andExpect(jsonPath("$.last").value(true));

        verify(racketService).getRackets(PageRequest.of(0, 10));
    }

    @Test
    void getAllRackets_WhenServiceReturnsEmptyList_ShouldReturnEmptyList() throws Exception {

        when(racketService.getRackets(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0));

        mockMvc.perform(get("/api/v1/rackets")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.last").value(true));

        verify(racketService).getRackets(PageRequest.of(0, 10));
    }

    @Test
    void getAllRackets_ShouldAcceptPageAndSizeQueryParameters() throws Exception {
        when(racketService.getRackets(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(preDto2), PageRequest.of(1, 2), 3));

        mockMvc.perform(get("/api/v1/rackets").param("page", "1").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].brand").value("Wilson"))
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.last").value(true));

        verify(racketService).getRackets(PageRequest.of(1, 2));
    }

    @Test
    void getRacketById_ShouldReturnRacket() throws Exception {
        when(racketService.getRacketById(1L)).thenReturn(Optional.of(dto1));

        mockMvc.perform(get("/api/v1/rackets/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.brand").value("Babolat"));
    }

    @Test
    void getRacketById_WhenNotFound_ShouldReturn404() throws Exception {
        when(racketService.getRacketById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/rackets/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void getRacketImageReturnsBytesWithDetectedPngContentType() throws Exception {
        byte[] png = HexFormat.of().parseHex("89504e470d0a1a0a");
        when(racketService.getRacketImage(1L))
                .thenReturn(new InputStreamResource(new ByteArrayInputStream(png)));

        mockMvc.perform(get("/api/v1/rackets/1/image"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().bytes(png));
    }

    @Test
    void createRacket_ShouldReturnCreated() throws Exception {
        RacketDTO newRacket = new RacketDTO(null, "Babolat", "Pure Aero", "Buen control", 14.5, 3);

        when(racketService.createRacket(any(RacketDTO.class))).thenReturn(dto1);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/rackets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newRacket))) // <--- Conversión automática a JSON
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, org.hamcrest.Matchers.endsWith("/api/v1/rackets/1")))
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void deleteRacket_ShouldReturnNoContent() throws Exception {
        when(racketService.deleteRacket(1L)).thenReturn(dto1);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/rackets/1"))
                .andExpect(status().isOk());
    }

    @Test
    void updateRacket_ShouldReturnUpdatedRacket() throws Exception {
        // Given
        when(racketService.updateRacket(1L, dto2)).thenReturn(dto1);

        // When / Then
        mockMvc.perform(put("/api/v1/rackets/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
        verify(racketService).updateRacket(eq(1L), any(RacketDTO.class));
    }

    @Test
    void getRacketImage_WhenJpeg_ShouldReturnJpegContentType() throws Exception {
        // Given
        byte[] jpeg = HexFormat.of().parseHex("ffd8ffff");
        when(racketService.getRacketImage(1L))
                .thenReturn(new InputStreamResource(new ByteArrayInputStream(jpeg)));

        // When / Then
        mockMvc.perform(get("/api/v1/rackets/1/image"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE));
    }

    @Test
    void getRacketImage_WhenGif_ShouldReturnGifContentType() throws Exception {
        // Given
        when(racketService.getRacketImage(1L))
                .thenReturn(new InputStreamResource(new ByteArrayInputStream("GIF89a".getBytes())));

        // When / Then
        mockMvc.perform(get("/api/v1/rackets/1/image"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_GIF_VALUE));
    }

    @Test
    void getRacketImage_WhenWebp_ShouldReturnWebpContentType() throws Exception {
        // Given
        byte[] webp = "RIFFxxxxWEBP".getBytes();
        when(racketService.getRacketImage(1L))
                .thenReturn(new InputStreamResource(new ByteArrayInputStream(webp)));

        // When / Then
        mockMvc.perform(get("/api/v1/rackets/1/image"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "image/webp"));
    }

    @Test
    void getRacketImage_WhenUnknownFormat_ShouldReturnOctetStream() throws Exception {
        // Given
        when(racketService.getRacketImage(1L))
                .thenReturn(new InputStreamResource(new ByteArrayInputStream(new byte[]{1, 2, 3})));

        // When / Then
        mockMvc.perform(get("/api/v1/rackets/1/image"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE));
    }

    @Test
    void replaceRacketImage_ShouldReturnNoContent() throws Exception {
        // Given
        org.springframework.mock.web.MockMultipartFile image =
                new org.springframework.mock.web.MockMultipartFile("imageFile", "racket.png",
                        MediaType.IMAGE_PNG_VALUE, new byte[]{1, 2, 3});

        // When / Then
        mockMvc.perform(multipart("/api/v1/rackets/1/image").file(image).with(request -> {
                    request.setMethod("PUT");
                    return request;
                }))
                .andExpect(status().isNoContent());
        verify(racketService).replaceRacketImage(eq(1L), any(), eq(3L));
    }

    @Test
    void deleteRacketImage_ShouldReturnNoContent() throws Exception {
        // Given
        doNothing().when(racketService).deleteRacketImage(1L);

        // When / Then
        mockMvc.perform(delete("/api/v1/rackets/1/image"))
                .andExpect(status().isNoContent());
        verify(racketService).deleteRacketImage(1L);
    }
}
