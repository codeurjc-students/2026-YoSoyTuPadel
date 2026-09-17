package es.urjc.code.yosoytupadel.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.sql.Blob;


@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    private String encodedPassword;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false)
    private Double skillLevel = Math.clamp(1.0, 0.0, 5.0);

    @Lob
    @JsonIgnore
    private Blob profilePicture;


    @JsonIgnore
    private String imgUserPath;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "racket_id")
    private Racket racket;

    public User() {}

    public User(String name, String nickname, String email, String encodedPassword, UserRole role) {
        this.name = name;
        this.nickname = nickname;
        this.email = email;
        this.encodedPassword = encodedPassword;
        this.role = role;
    }
    public User(String email, String encodedPassword, UserRole role) {
        this.email = email;
        this.encodedPassword = encodedPassword;
        this.role = role;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getEncodedPassword() { return this.encodedPassword; }
    public void setEncodedPassword(String password) { this.encodedPassword = password; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public Double getSkillLevel() { return skillLevel; }
    public void setSkillLevel(Double skillLevel) { this.skillLevel = skillLevel; }
    public Blob getProfilePicture() { return profilePicture; }
    public void setProfilePicture(Blob profilePicture) { this.profilePicture = profilePicture; }
    public Racket getRacket() { return racket; }
    public void setRacket(Racket racket) { this.racket = racket; }
    public String getImgUserPath() {return imgUserPath;}
    public void setImgUserPath(String imgUserPath) {this.imgUserPath = imgUserPath;}
}