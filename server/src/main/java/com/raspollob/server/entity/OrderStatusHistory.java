package com.raspollob.server.entity;

import com.raspollob.server.entity.enums.OrderStatus;
import com.raspollob.server.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/** Audit trail entry: who changed an order's status or payment status, when, and why. */
@Entity
@Table(name = "order_status_history", indexes = {
        @Index(name = "idx_order_history_order", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OrderStatusHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** Order status after this change (null when only the payment status changed) */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private OrderStatus status;

    /** Payment status after this change (null when only the order status changed) */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    private PaymentStatus paymentStatus;

    @Column(columnDefinition = "TEXT")
    private String note;

    /** Username of the staff member, or "customer" / "system" */
    @Column(name = "changed_by", length = 120)
    private String changedBy;
}
