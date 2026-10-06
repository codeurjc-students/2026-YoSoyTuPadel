package es.urjc.code.yosoytupadel.backend.unit.security;

import es.urjc.code.yosoytupadel.backend.security.jwt.JwtTokenProvider;
import es.urjc.code.yosoytupadel.backend.security.jwt.TokenType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private HttpServletRequest request;

    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        userDetails = new User("victor@alumno.com", "password", Collections.emptyList());
    }

    @Test  //Debe generar un Access Token válido y extraer sus Claims correctamente
    void generateAndValidateAccessToken() {
        String token = jwtTokenProvider.generateAccessToken(userDetails);

        assertThat(token).isNotBlank();

        Claims claims = jwtTokenProvider.validateToken(token);
        assertThat(claims.getSubject()).isEqualTo("victor@alumno.com");
        assertThat(claims.get("type")).isEqualTo("ACCESS");
    }

    @Test //Debe generar un Refresh Token válido y extraer sus Claims correctamente
    void generateAndValidateRefreshToken() {
        String token = jwtTokenProvider.generateRefreshToken(userDetails);

        assertThat(token).isNotBlank();

        Claims claims = jwtTokenProvider.validateToken(token);
        assertThat(claims.getSubject()).isEqualTo("victor@alumno.com");
        assertThat(claims.get("type")).isEqualTo("REFRESH");
    }

    @Test //Debe extraer el token de la cabecera Authorization correctamente
    void tokenStringFromHeaders_Valid() {
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer mi.token.jwt");

        String token = jwtTokenProvider.tokenStringFromHeaders(request);

        assertThat(token).isEqualTo("mi.token.jwt");
    }

    @Test //Debe lanzar excepción si falta la cabecera Authorization
    void tokenStringFromHeaders_NullHeader() {
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn(null);

        assertThatThrownBy(() -> jwtTokenProvider.tokenStringFromHeaders(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Missing Authorization header");
    }

    @Test //Debe lanzar excepción si la cabecera no empieza con el prefijo Bearer
    void tokenStringFromHeaders_InvalidPrefix() {
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Basic dXNlcjpwYXNz");

        assertThatThrownBy(() -> jwtTokenProvider.tokenStringFromHeaders(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not start with Bearer");
    }

    @Test //Debe extraer y validar el token directamente desde las cookies
    void validateToken_FromCookie_Valid() {
        String generatedToken = jwtTokenProvider.generateAccessToken(userDetails);
        Cookie cookie = new Cookie(TokenType.ACCESS.cookieName, generatedToken);
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});

        Claims claims = jwtTokenProvider.validateToken(request, true);

        assertThat(claims.getSubject()).isEqualTo("victor@alumno.com");
    }

    @Test //Debe lanzar excepción si el array de cookies es nulo
    void tokenStringFromCookies_NullCookies() {
        when(request.getCookies()).thenReturn(null);

        assertThatThrownBy(() -> jwtTokenProvider.validateToken(request, true))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No cookies found");
    }

    @Test //Debe lanzar excepción si la cookie existe pero su valor es nulo
    void tokenStringFromCookies_NullValueInCookie() {
        Cookie cookie = new Cookie(TokenType.ACCESS.cookieName, null);
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});

        assertThatThrownBy(() -> jwtTokenProvider.validateToken(request, true))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("has null value");
    }

    @Test //Debe lanzar JwtException al intentar validar un token alterado o con firma incorrecta
    void validateToken_InvalidSignature() {
        String token = jwtTokenProvider.generateAccessToken(userDetails);
        String alteredToken = token.substring(0, token.length() - 5) + "abcde";

        assertThatThrownBy(() -> jwtTokenProvider.validateToken(alteredToken))
                .isInstanceOf(JwtException.class);
    }
}