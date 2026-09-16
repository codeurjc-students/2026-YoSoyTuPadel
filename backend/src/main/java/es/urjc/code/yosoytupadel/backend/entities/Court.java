package es.urjc.code.yosoytupadel.backend.entities;

import jakarta.persistence.*;


@Entity
@Table(name = "courts")
public class Court {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private Double courtPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourtType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SurfaceType surface;


    private Boolean isAvailable = true;

    private Double qualification = Math.clamp(2.5, 0.0, 5.0);


    public Court() {}

    public Court(String name, Double courtPrice, CourtType type, SurfaceType surface, Double qualification) {
        this.name = name;
        this.courtPrice = courtPrice;
        this.type = type;
        this.surface = surface;
        this.qualification = qualification;
        this.isAvailable = true;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getCourtPrice() { return courtPrice; }
    public void setCourtPrice(Double courtPrice) { this.courtPrice = courtPrice; }
    public CourtType getType() { return type; }
    public void setType(CourtType type) { this.type = type; }
    public SurfaceType getSurface() { return surface; }
    public void setSurface(SurfaceType surface) { this.surface = surface; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public Double getQualification() { return qualification; }
    public void setQualification(Double qualification) { this.qualification = qualification; }

}