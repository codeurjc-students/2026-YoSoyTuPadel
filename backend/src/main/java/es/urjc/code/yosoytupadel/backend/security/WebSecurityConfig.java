package es.urjc.code.yosoytupadel.backend.security;

import es.urjc.code.yosoytupadel.backend.security.jwt.JwtRequestFilter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;


import java.util.Arrays;
import java.util.List;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {

    @Autowired
    public RepositoryUserDetailsService userDetailService;

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authenticationProvider(authenticationProvider());

        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        http.authorizeHttpRequests(authorize -> authorize

                // AUTH ENDPOINTS
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/refresh","/api/v1/auth/logout","/api/v1/users/new").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/rackets").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/courts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/coachs").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/coachs/*/image").permitAll()

                // Rackets
                .requestMatchers(HttpMethod.GET, "/api/v1/rackets/*/image").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/rackets/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/v1/rackets/**").hasRole("ADMIN")

                // Courts
                .requestMatchers(HttpMethod.GET, "/api/v1/courts/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/v1/courts/**").hasRole("ADMIN")

                // Bookings
                .requestMatchers(HttpMethod.GET, "/api/v1/bookings").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/bookings/*").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/bookings").hasRole("USER")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/bookings/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/bookings/**").hasRole("ADMIN")

                // Users
                .requestMatchers(HttpMethod.PATCH, "/api/v1/users/*/racket", "/api/v1/users/*/racket-returned").hasRole("USER")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/users/*/skill-level").hasAnyRole("COACH", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/users/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/users/*/bookings/matches", "/api/v1/users/*/bookings/trainings").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/v1/users/**").hasAnyRole("USER", "ADMIN")

                .anyRequest().authenticated()
        );

        // Disable Form login Authentication
        http.formLogin(formLogin -> formLogin.disable());

        // Disable CSRF protection (it is difficult to implement in REST APIs)
        http.csrf(csrf -> csrf.disable());

        // Disable Basic Authentication
        http.httpBasic(httpBasic -> httpBasic.disable());

        // Stateless session
        http.sessionManagement(management -> management.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // Add JWT Token filter
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
