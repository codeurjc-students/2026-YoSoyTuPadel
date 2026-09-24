package es.urjc.code.yosoytupadel.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.sql.Blob;


@Entity
@Table(name = "rackets")
@Data
@AllArgsConstructor
public class Racket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String brand;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private double pricePerDay;

    @Lob
    @JsonIgnore
    private Blob image;


    @JsonIgnore
    private String racketImagePath;


    @Column(nullable = false)
    private Integer stock = 3;

    public Racket() {}

    public Racket(String brand, String name, String description, double pricePerDay) {
        this.brand = brand;
        this.name = name;
        this.description = description;
        this.pricePerDay = pricePerDay;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getPricePerDay() { return pricePerDay; }
    public void setPricePerDay(double pricePerDay) { this.pricePerDay = pricePerDay; }
    public Blob getImage() { return image; }
    public void setImage(Blob image) { this.image = image; }
    public String getRacketImagePath() {return racketImagePath;}
    public void setRacketImagePath(String racketImagePath) {this.racketImagePath = racketImagePath;}
    public Integer getStock() {return stock;}
    public void setStock(Integer stock) {this.stock = stock;}
}