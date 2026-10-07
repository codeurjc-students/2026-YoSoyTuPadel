package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.*;
import es.urjc.code.yosoytupadel.backend.security.jwt.TokenType;
import es.urjc.code.yosoytupadel.backend.entities.BookingType;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import es.urjc.code.yosoytupadel.backend.service.UserService;

import java.io.IOException;
import java.net.URI;
import java.sql.SQLException;
import java.util.Collection;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private BookingService bookingService;

    @Operation(summary = "Get all users (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found all users", content = { @Content(mediaType = "application/json") }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("")
    public Collection<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @Operation(summary = "Get a user by id (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the user", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public UserDTO getUser(@PathVariable long id) {
        return userService.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Operation(summary = "Register a new user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User created successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid user data supplied", content = @Content)
    })
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/new")
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        UserDTO responseDTO = userService.createUser(userDTO);

        String collectionPath = Objects.requireNonNull(ServletUriComponentsBuilder.fromCurrentRequestUri()
                        .build()
                        .getPath())
                .replaceFirst("/new$", "");
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .replacePath(collectionPath + "/{id}")
                .buildAndExpand(responseDTO.id())
                .toUri();

        return ResponseEntity.created(location).body(responseDTO);
    }

    @Operation(summary = "Update an existing user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User updated successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = UserUpdateDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid update data supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Cannot modify other users", content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN') or (hasAnyRole('USER', 'COACH') and @userService.isMe(#id))")
    @PutMapping("/{id}")
    public ResponseEntity<UserUpdateDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateDTO updateDTO,
            HttpServletResponse response) {


        String oldEmail = userService.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"))
                .email();

        UserUpdateDTO updatedUser = userService.updateUser(id, updateDTO);

        Long authenticatedUserId = userService.getAuthenticatedUserDto()
                .map(user -> user.id())
                .orElse(-1L);

        boolean emailChanged = updateDTO.email() != null && !oldEmail.equalsIgnoreCase(updateDTO.email().trim());
        boolean isSelfEdit = id.equals(authenticatedUserId);

        if (emailChanged && isSelfEdit) {

            // Delete AUTH TOKEN
            Cookie accessCookie = new Cookie(TokenType.ACCESS.cookieName, null);
            accessCookie.setMaxAge(0);
            accessCookie.setHttpOnly(true);
            accessCookie.setPath("/");
            response.addCookie(accessCookie);

            // Delete REFRESH TOKEN
            Cookie refreshCookie = new Cookie(TokenType.REFRESH.cookieName, null);
            refreshCookie.setMaxAge(0); // Destruction order
            refreshCookie.setHttpOnly(true);
            refreshCookie.setPath("/");
            response.addCookie(refreshCookie);

            response.addHeader("X-Email-Changed", "true");
        }

        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Update user skill level")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Skill level updated successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Invalid change value supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin or Coach rights required", content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('ADMIN','COACH')")
    @PatchMapping("/{id}/skill-level")
    public UserDTO updateSkillLevel(@PathVariable long id, @RequestParam Double change) {

        return userService.updateSkillLevel(id, change);
    }

    @Operation(summary = "Rent a racket for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Racket rented successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class)) }),
            @ApiResponse(responseCode = "400", description = "Racket not available", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Cannot rent for other users", content = @Content),
            @ApiResponse(responseCode = "404", description = "User or Racket not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("@userService.isMe(#id)")
    @PatchMapping("/{id}/racket/{racketId}")
    public UserDTO rentRacket(@PathVariable long id, @PathVariable long racketId) {
        return userService.rentRacket(id, racketId);
    }

    @Operation(summary = "Return a rented racket")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Racket returned successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Cannot return for other users", content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("@userService.isMe(#id)")
    @DeleteMapping("/{id}/racket")
    public UserDTO returnRacket(@PathVariable long id) {
        return userService.returnRacket(id);
    }

    @Operation(summary = "Delete a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User deleted successfully", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin or self-access required", content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @DeleteMapping("/{id}")
    public UserDTO deleteUser(@PathVariable long id) {
        return userService.deleteUser(id);
    }

    @Operation(summary = "Get user profile image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the image", content = { @Content(mediaType = "image/jpeg") }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Access denied", content = @Content),
            @ApiResponse(responseCode = "404", description = "Image or user not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COACH') or @userService.isMe(#id)")
    @GetMapping("/{id}/image")
    public ResponseEntity<Object> getUserImage(@PathVariable long id) throws SQLException {

        Resource profilePicture = userService.getUserImage(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg")
                .body(profilePicture);
    }

    @Operation(summary = "Replace or upload a user profile image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Image updated successfully", content = @Content),
            @ApiResponse(responseCode = "400", description = "Invalid file supplied", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Cannot modify other users", content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or (hasAnyRole('USER', 'COACH') and @userService.isMe(#id))")
    @PutMapping("/{id}/image")
    public ResponseEntity<Object> replaceUserImage(@PathVariable long id, @RequestParam MultipartFile imageFile)
            throws IOException {
        userService.replaceUserImage(id, imageFile.getInputStream(), imageFile.getSize());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Delete user profile image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User image deleted successfully", content = { @Content(mediaType = "text/plain") }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Cannot delete for other users", content = @Content),
            @ApiResponse(responseCode = "404", description = "User or image not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @DeleteMapping("/{id}/image")
    public ResponseEntity<String> deleteUserImage(@PathVariable long id) {
            userService.deleteUserImage(id);
            return ResponseEntity.ok("User image deleted successfully");
    }

    @Operation(summary = "Get the currently authenticated user's details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authenticated user retrieved", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class)) }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getAuthenticatedUser() {
        return userService.getAuthenticatedUserDto()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @Operation(summary = "Get a paginated list of all coaches")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the coaches", content = { @Content(mediaType = "application/json") })
    })
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/coaches")
    public ResponseEntity<Page<CoachDTO>> getAllCoachs(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(userService.getCoachs(pageable));
    }

    @Operation(summary = "Get a specific coach by id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the coach", content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CoachDTO.class)) }),
            @ApiResponse(responseCode = "404", description = "Coach not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/coaches/{id}")
    public CoachDTO getCoach(@PathVariable long id) {
        return userService.getCoachById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coach not found"));
    }

    @Operation(summary = "Get a coach's profile image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the image", content = { @Content(mediaType = "image/jpeg") }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a coach", content = @Content),
            @ApiResponse(responseCode = "404", description = "Coach or image not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("@userService.isCoach(#id)")
    @GetMapping("/coaches/{id}/image")
    public ResponseEntity<Object> getImageCoach(@PathVariable long id) throws SQLException {
        Resource profilePicture = userService.getUserImage(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg")
                .body(profilePicture);
    }

    @Operation(summary = "Get all bookings for a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found user bookings", content = { @Content(mediaType = "application/json") }),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Access denied", content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @GetMapping("/{id}/bookings")
    public Collection<BookingDTO> getAllBookingsByUserId(
            @PathVariable Long id,
            @RequestParam(required = false) BookingType type
    ) {
        userService.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (type == BookingType.MATCH) {
            return bookingService.getMatchBookingsByUserId(id);
        }
        if (type == BookingType.TRAINING) {
            return bookingService.getTrainingBookingsByUserId(id);
        }
        return bookingService.getAllBookingsByUserId(id);
    }
}