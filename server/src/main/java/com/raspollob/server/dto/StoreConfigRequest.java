package com.raspollob.server.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreConfigRequest {
    // Branding & homepage
    private String storeLogo;
    @jakarta.validation.constraints.Pattern(regexp = "^$|^#[0-9a-fA-F]{6}$", message = "Brand colour must look like #5c8b29")
    private String primaryColor;
    private String secondaryColor;
    @Size(max = 300, message = "Footer description can be at most 300 characters")
    private String footerDescription;
    private List<String> heroBannerImages;
    private String promoBannerImage;
    private String categorySectionTitle;
    private String categorySectionDesc;
    private String trendingSectionTitle;
    private String trendingSectionDesc;
    private String justForYouSectionTitle;
    private String justForYouSectionDesc;
    private List<CustomerReviewDto> customerReviews;

    // Info pages
    private String contactUsInfo;
    private String shippingDeliveryInfo;
    private String returnsRefundsInfo;
    private String faqsInfo;
    private String trackOrderInfo;
    private String needHelpInfo;

    // Social links
    private String facebookUrl;
    private Boolean facebookActive;
    private String instagramUrl;
    private Boolean instagramActive;
    private String youtubeUrl;
    private Boolean youtubeActive;
    private String tiktokUrl;
    private Boolean tiktokActive;

    // Store contact
    private String storeAddress;
    private String storePhone;
    private String storeEmail;
    private String storeHours;

    // Checkout & payments
    @DecimalMin(value = "0.00", message = "Shipping fee cannot be negative")
    private BigDecimal shippingFeeInsideDhaka;
    @DecimalMin(value = "0.00", message = "Shipping fee cannot be negative")
    private BigDecimal shippingFeeOutsideDhaka;
    @DecimalMin(value = "0.00", message = "Free shipping threshold cannot be negative")
    private BigDecimal freeShippingThreshold;
    private Boolean codEnabled;
    @Size(max = 20)
    private String bkashNumber;
    @Size(max = 20)
    private String nagadNumber;
    @Size(max = 20)
    private String rocketNumber;
    private String paymentInstructions;

    // Welcome offer popup
    private Boolean offerEnabled;
    @Size(max = 500)
    private String offerImage;
    @Size(max = 120, message = "Offer title can be at most 120 characters")
    private String offerTitle;
    @Size(max = 500, message = "Offer text can be at most 500 characters")
    private String offerText;
    @Size(max = 40, message = "Promo code can be at most 40 characters")
    private String offerPromoCode;
    @Size(max = 40, message = "Button text can be at most 40 characters")
    private String offerButtonText;
    @Size(max = 300, message = "Button link can be at most 300 characters")
    private String offerButtonLink;
    private java.time.LocalDateTime offerStartsAt;
    private java.time.LocalDateTime offerEndsAt;
}
