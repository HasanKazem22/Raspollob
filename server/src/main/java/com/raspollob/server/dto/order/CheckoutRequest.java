package com.raspollob.server.dto.order;

import com.raspollob.server.entity.enums.DeliveryZone;
import com.raspollob.server.entity.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    /** Generated once per checkout by the client; resubmitting returns the same order */
    @NotBlank(message = "Missing checkout key")
    @Size(max = 64)
    private String idempotencyKey;

    @NotEmpty(message = "Your cart is empty")
    @Size(max = 50, message = "Too many different items in one order")
    @Valid
    private List<CartLineRequest> items;

    @NotNull(message = "Shipping address is required")
    @Valid
    private AddressDto shippingAddress;

    @Builder.Default
    private Boolean billingSameAsShipping = true;

    /** Required when billingSameAsShipping is false */
    @Valid
    private AddressDto billingAddress;

    @NotNull(message = "Delivery area is required")
    private DeliveryZone deliveryZone;

    @NotNull(message = "Choose a payment method")
    private PaymentMethod paymentMethod;

    /** Required for online payment methods */
    @Size(max = 64)
    private String transactionId;

    /** Required for online payment methods */
    @Size(max = 20)
    private String paymentSenderNumber;

    @Size(max = 40)
    private String promoCode;

    @Size(max = 1000, message = "Notes can be at most 1000 characters")
    private String customerNote;
}
