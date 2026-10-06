package com.raspollob.server.entity;

import com.raspollob.server.entity.enums.DeliveryZone;
import com.raspollob.server.entity.enums.OrderStatus;
import com.raspollob.server.entity.enums.PaymentMethod;
import com.raspollob.server.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "CustomerOrder") // "Order" clashes with the ORDER keyword in JPQL
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_number", columnList = "order_number", unique = true),
        @Index(name = "idx_order_status_created", columnList = "status, created_at"),
        @Index(name = "idx_order_shipping_phone", columnList = "shipping_phone"),
        @Index(name = "idx_order_transaction_id", columnList = "transaction_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Order extends BaseEntity {

    /** Human-friendly reference shown to customers, e.g. RP251005-K7QX */
    @Column(name = "order_number", nullable = false, unique = true, length = 20)
    private String orderNumber;

    /** Client-generated key; repeating a submission returns the same order */
    @Column(name = "idempotency_key", unique = true, length = 64)
    private String idempotencyKey;

    /** Signed-in customer, or null for guest checkout */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    // --- Addresses -----------------------------------------------------------

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "fullName", column = @Column(name = "shipping_full_name", length = 120)),
            @AttributeOverride(name = "phone", column = @Column(name = "shipping_phone", length = 20)),
            @AttributeOverride(name = "email", column = @Column(name = "shipping_email", length = 160)),
            @AttributeOverride(name = "addressLine", column = @Column(name = "shipping_address_line", length = 500)),
            @AttributeOverride(name = "area", column = @Column(name = "shipping_area", length = 120)),
            @AttributeOverride(name = "city", column = @Column(name = "shipping_city", length = 80)),
            @AttributeOverride(name = "postalCode", column = @Column(name = "shipping_postal_code", length = 12))
    })
    private Address shippingAddress;

    @Builder.Default
    @Column(name = "billing_same_as_shipping", nullable = false)
    private Boolean billingSameAsShipping = true;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "fullName", column = @Column(name = "billing_full_name", length = 120)),
            @AttributeOverride(name = "phone", column = @Column(name = "billing_phone", length = 20)),
            @AttributeOverride(name = "email", column = @Column(name = "billing_email", length = 160)),
            @AttributeOverride(name = "addressLine", column = @Column(name = "billing_address_line", length = 500)),
            @AttributeOverride(name = "area", column = @Column(name = "billing_area", length = 120)),
            @AttributeOverride(name = "city", column = @Column(name = "billing_city", length = 80)),
            @AttributeOverride(name = "postalCode", column = @Column(name = "billing_postal_code", length = 12))
    })
    private Address billingAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_zone", nullable = false, length = 20)
    private DeliveryZone deliveryZone;

    // --- Payment -------------------------------------------------------------

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus;

    /** Mobile-banking transaction ID entered by the customer */
    @Column(name = "transaction_id", length = 64)
    private String transactionId;

    /** Mobile-banking account the customer paid from */
    @Column(name = "payment_sender_number", length = 20)
    private String paymentSenderNumber;

    // --- Amounts (all in BDT, computed server-side) ---------------------------

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingFee;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    /** Total quantity across all lines, stored for cheap list views */
    @Column(name = "item_count", nullable = false)
    private Integer itemCount;

    // --- Promotion -----------------------------------------------------------

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promo_code_id")
    private PromoCode promoCode;

    /** Code as entered, kept even if the promo is later deleted */
    @Column(name = "promo_code_text", length = 40)
    private String promoCodeText;

    // --- Notes ---------------------------------------------------------------

    @Column(name = "customer_note", columnDefinition = "TEXT")
    private String customerNote;

    /** Internal note, never shown to the customer */
    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void addHistory(OrderStatusHistory entry) {
        statusHistory.add(entry);
        entry.setOrder(this);
    }
}
