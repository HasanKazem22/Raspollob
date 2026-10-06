package com.raspollob.server.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

/** Postal address embedded in an order (shipping and billing use column prefixes). */
@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Column(length = 120)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(length = 160)
    private String email;

    @Column(length = 500)
    private String addressLine;

    @Column(length = 120)
    private String area;

    @Column(length = 80)
    private String city;

    @Column(length = 12)
    private String postalCode;
}
