package com.raspollob.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreConfigResponse {
    private Long id;

    // Branding & homepage
    private String storeLogo;
    private String primaryColor;
    private String secondaryColor;
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

    // Checkout & payments (defaults already applied)
    private BigDecimal shippingFeeInsideDhaka;
    private BigDecimal shippingFeeOutsideDhaka;
    private BigDecimal freeShippingThreshold;
    private Boolean codEnabled;
    private String bkashNumber;
    private String nagadNumber;
    private String rocketNumber;
    private String paymentInstructions;

    // Welcome offer popup
    private Boolean offerEnabled;
    private String offerImage;
    private String offerTitle;
    private String offerText;
    private String offerPromoCode;
    private String offerButtonText;
    private String offerButtonLink;
    private java.time.LocalDateTime offerStartsAt;
    private java.time.LocalDateTime offerEndsAt;
    /** Enabled, has an image, and now is inside its dates: the storefront shows the popup */
    private Boolean offerActive;

    private LocalDateTime updatedAt;
}
