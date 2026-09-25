package es.urjc.code.yosoytupadel.backend.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate bookingDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Double bookingPrice;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Court court;


    @Enumerated(EnumType.STRING)
    private BookingType type;



    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private String score;

    @ManyToOne
    @JoinColumn(name = "coach_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User coach;


    public Booking() {}

    public Booking(LocalDate bookingDate, LocalTime startTime, LocalTime endTime, Double bookingPrice, User user, User coach) {
        this.bookingDate = bookingDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.bookingPrice = bookingPrice;
        this.user = user;
        this.coach = coach;
        this.status = BookingStatus.PENDING;
        this.type = BookingType.TRAINING;
    }

    public Booking(LocalDate bookingDate, LocalTime startTime, LocalTime endTime, Double bookingPrice, User user, Court court) {
        this.bookingDate = bookingDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.bookingPrice = bookingPrice;
        this.user = user;
        this.court = court;
        this.status = BookingStatus.PENDING;
        this.type = BookingType.MATCH;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public Double getBookingPrice() { return bookingPrice; }
    public void setBookingPrice(Double bookingPrice) { this.bookingPrice = bookingPrice; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Court getCourt() { return court; }
    public void setCourt(Court court) { this.court = court; }
    public BookingType getType() {return type;}
    public void setType(BookingType type) {this.type = type;}
    public String getScore() {return score;}
    public void setScore(String score) {this.score = score;}
    public BookingStatus getStatus() {return status;}
    public void setStatus(BookingStatus status) {this.status = status;}
    public User getCoach() {return coach;}
    public void setCoach(User coach) {this.coach = coach;}
}