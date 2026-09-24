package es.urjc.code.yosoytupadel.backend.controller;

import es.urjc.code.yosoytupadel.backend.dto.*;
import es.urjc.code.yosoytupadel.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
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

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private BookingService bookingService;


    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("")
    public Collection<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public UserDTO getUser(@PathVariable long id) {
        return userService.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @PostMapping("/new")
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        UserDTO responseDTO = userService.createUser(userDTO);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(responseDTO.id())
                .toUri();

        return ResponseEntity.created(location).body(responseDTO);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @PutMapping("/{id}")
    public UserDTO replaceUser(@RequestBody UserUpdateDTO userDTO, @PathVariable Long id) throws SQLException {
        return userService.updateUser(id, userDTO);
    }

    @PreAuthorize("hasAnyRole('ADMIN','COACH')")
    @PatchMapping("/{id}/skill-level")
    public UserDTO updateSkillLevel(@PathVariable long id, @RequestParam Double change) {

        return userService.updateSkillLevel(id, change);
    }

    @PreAuthorize("@userService.isMe(#id)")
    @PatchMapping("/{id}/racket")
    public UserDTO rentRacket(@PathVariable long id, @RequestParam long racketId) {
        return userService.rentRacket(id, racketId);
    }

    @PreAuthorize("@userService.isMe(#id)")
    @PatchMapping("/{id}/racket-returned")
    public UserDTO returnRacket(@PathVariable long id) {
        return userService.returnRacket(id);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @DeleteMapping("/{id}")
    public UserDTO deleteUser(@PathVariable long id) {
        return userService.deleteUser(id);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @GetMapping("/{id}/image")
    public ResponseEntity<Object> getUserImage(@PathVariable long id) throws SQLException {

        Resource profilePicture = userService.getUserImage(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg")
                .body(profilePicture);
    }


    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @PutMapping("/{id}/image")
    public ResponseEntity<Object> replaceUserImage(@PathVariable long id, @RequestParam MultipartFile imageFile)
            throws IOException {
        userService.replaceUserImage(id, imageFile.getInputStream(), imageFile.getSize());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @DeleteMapping("/{id}/image")
    public ResponseEntity<String> deleteUserImage(@PathVariable long id) {
            userService.deleteUserImage(id);
            return ResponseEntity.ok("User image deleted successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getAuthenticatedUser() {
        return userService.getAuthenticatedUserDto()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }


    @GetMapping("/coachs")
    public ResponseEntity<Collection<CoachDTO>> getAllCoachs() {
        return ResponseEntity.ok(userService.getAllCoachs());
    }

    @PreAuthorize("@userService.isCoach(#id)")
    @GetMapping("/coachs/{id}/image")
    public ResponseEntity<Object> getImageCoach(@PathVariable long id) throws SQLException {
        Resource profilePicture = userService.getUserImage(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg")
                .body(profilePicture);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @GetMapping("/{id}/bookings")
    public Collection<BookingDTO> getAllBookingsByUserId(@PathVariable Long id) {
        return bookingService.getAllBookingsByUserId(id);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @GetMapping("/{id}/bookings/matches")
    public Collection<BookingDTO> getUserMatchBookings(@PathVariable Long id) {
        userService.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return bookingService.getMatchBookingsByUserId(id);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isMe(#id)")
    @GetMapping("/{id}/bookings/trainings")
    public Collection<BookingDTO> getUserTrainingBookings(@PathVariable Long id) {
        userService.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return bookingService.getTrainingBookingsByUserId(id);
    }
}