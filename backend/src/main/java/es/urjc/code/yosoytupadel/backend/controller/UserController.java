package es.urjc.code.yosoytupadel.backend.controller;

import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import es.urjc.code.yosoytupadel.backend.entities.User;
import es.urjc.code.yosoytupadel.backend.dto.UserDTO;
import es.urjc.code.yosoytupadel.backend.dto.UserMapper;
import es.urjc.code.yosoytupadel.backend.service.UserService;

import java.io.IOException;
import java.net.URI;
import java.nio.file.AccessDeniedException;
import java.sql.SQLException;
import java.util.Collection;

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

    @PostMapping("")
    public ResponseEntity<UserDTO> createUser(@RequestBody User user) {
        User savedUser = userService.createUser(user);
        UserDTO responseDTO = mapper.toDTO(savedUser);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(responseDTO.id())
                .toUri();

        return ResponseEntity.created(location).body(responseDTO);
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
    public ResponseEntity<Object> deletePostImage(@PathVariable long id) throws IOException, SQLException {
        userService.deleteUserImage(id);
        return ResponseEntity.noContent().build();

    }
}