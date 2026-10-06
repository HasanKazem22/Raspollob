package com.raspollob.server.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "customer_reviews")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerReview extends BaseEntity {

    private String name;
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;
    
    private String profileImage;
}
