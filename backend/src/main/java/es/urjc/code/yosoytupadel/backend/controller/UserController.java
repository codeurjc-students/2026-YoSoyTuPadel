package es.urjc.code.yosoytupadel.backend.controller;

import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserMapper;
import es.urjc.code.yosoytupadel.backend.service.UserService;

import java.io.IOException;
import java.net.URI;
import java.sql.SQLException;
import java.util.Collection;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final UserMapper mapper;

    public UserController(UserService userService, UserMapper mapper) {
        this.userService = userService;
        this.mapper = mapper;
    }

    @GetMapping("")
    public Collection<UserDTO> getAllUsers() {
        return mapper.toDTOs(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public UserDTO getUser(@PathVariable long id) {
        return mapper.toDTO(userService.getUserById(id));
    }


    @PatchMapping("/{id}/skill-level")
    public UserDTO updateSkillLevel(@PathVariable long id, @RequestParam Double change) {

        User updatedStudent = userService.updateSkillLevel(id, change);
        return mapper.toDTO(updatedStudent);
    }

    @PatchMapping("/{id}/racket")
    public UserDTO rentRacket(@PathVariable long id, @RequestParam long racketId) {
        return mapper.toDTO(userService.rentRacket(id, racketId));
    }

    @PatchMapping("/{id}/racket-returned")
    public UserDTO returnRacket(@PathVariable long id) {
        return mapper.toDTO(userService.returnRacket(id));
    }

    @DeleteMapping("/{id}")
    public UserDTO deleteUser(@PathVariable long id) {
        return mapper.toDTO(userService.deleteUser(id));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<Object> getUserImage(@PathVariable long id) throws SQLException {

        Resource profilePicture = userService.getUserImage(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg")
                .body(profilePicture);
    }

//    @PostMapping("{id}/image")
//    public ResponseEntity<Object> createUserImage(@PathVariable long id, @RequestParam MultipartFile imageFile)
//            throws IOException {
//
//        URI location = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
//
//        userService.createUserImage(id, location, imageFile.getInputStream(), imageFile.getSize());
//
//        return ResponseEntity.created(location).build();
//    }

    @PutMapping("/{id}/image")
    public ResponseEntity<Object> replaceUserImage(@PathVariable long id, @RequestParam MultipartFile imageFile)
            throws IOException {
        userService.replaceUserImage(id, imageFile.getInputStream(), imageFile.getSize());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/image")
    public ResponseEntity<String> deleteUserImage(@PathVariable long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority()
                            .equals("ROLE_ADMIN"))) {

                userService.deleteUserImage(id);
                return ResponseEntity.ok("User image deleted successfully");
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Forbidden: You are not allowed to delete this user image.");
            }

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User image not found or user does not exist.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An internal error occurred while trying to delete the user image.");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getAuthenticatedUser() {
        return userService.getAuthenticatedUserDto()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @PostMapping("/new")
    public ResponseEntity<?> createUser(@RequestBody UserDTO userDTO) {
        if (userService.existsByEmail(userDTO.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already in use"));
        }

        userDTO = userService.createUser(userDTO);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(userDTO.id())
                .toUri();

        return ResponseEntity.created(location).body(userDTO);
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    public UserDTO replaceUser(@RequestBody UserDTO userDTO, @PathVariable Long id) throws SQLException {

        UserDTO authenticatedUser = userService.getAuthenticatedUserDto()
                .orElseThrow(() -> new NoSuchElementException("User not authenticated"));

        // if is admin, can edit any user
        if (authenticatedUser.role().name().equals("ROLE_ADMIN")) {
            return userService.updateUser(id, userDTO);
        }

        // if is user, can edit only his own user
        if (authenticatedUser.id().equals(id) && userDTO.email() != null && !userDTO.email().trim().isEmpty()) {
            return userService.updateUser(id, userDTO);
        }

        // If not achieve any condition, return error 403 (Forbidden)
        throw new AccessDeniedException("You are not allowed to edit this user.");
    }
}