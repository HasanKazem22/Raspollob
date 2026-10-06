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
    private String primaryColor;
    private String secondaryColor;
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
}
