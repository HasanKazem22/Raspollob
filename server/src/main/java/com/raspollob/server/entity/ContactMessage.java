package com.raspollob.server.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "contact_messages")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ContactMessage extends BaseEntity {

    private String name;
    private String phone;
    
    @Column(columnDefinition = "TEXT")
    private String question;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isRead = false;
}
