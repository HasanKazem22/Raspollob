package com.raspollob.server.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "store_config")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class StoreConfig extends BaseEntity {

    @ElementCollection
    @CollectionTable(name = "store_config_hero_images", joinColumns = @JoinColumn(name = "store_config_id"))
    @Column(name = "image_url")
    @Builder.Default
    private List<String> heroBannerImages = new ArrayList<>();

    private String promoBannerImage;

    private String storeLogo;
    private String primaryColor;
    private String secondaryColor;

    private String categorySectionTitle;
    private String categorySectionDesc;

    private String trendingSectionTitle;
    private String trendingSectionDesc;

    private String justForYouSectionTitle;
    private String justForYouSectionDesc;

    // --- Checkout & payments --------------------------------------------------
    // Columns are nullable so they can be added to an existing table; StoreConfigService
    // applies the defaults below when a value is missing.

    public static final BigDecimal DEFAULT_SHIPPING_INSIDE_DHAKA = new BigDecimal("60");
    public static final BigDecimal DEFAULT_SHIPPING_OUTSIDE_DHAKA = new BigDecimal("120");

    @Column(precision = 12, scale = 2)
    private BigDecimal shippingFeeInsideDhaka;

    @Column(precision = 12, scale = 2)
    private BigDecimal shippingFeeOutsideDhaka;

    /** Orders with a subtotal at or above this ship free; null = never free */
    @Column(precision = 12, scale = 2)
    private BigDecimal freeShippingThreshold;

    private Boolean codEnabled;

    /** Merchant/personal numbers customers send money to; blank = method disabled */
    @Column(length = 20)
    private String bkashNumber;
    @Column(length = 20)
    private String nagadNumber;
    @Column(length = 20)
    private String rocketNumber;

    @Column(columnDefinition = "TEXT")
    private String paymentInstructions;

    @Column(columnDefinition = "TEXT")
    private String contactUsInfo;

    @Column(columnDefinition = "TEXT")
    private String shippingDeliveryInfo;

    @Column(columnDefinition = "TEXT")
    private String returnsRefundsInfo;

    @Column(columnDefinition = "TEXT")
    private String faqsInfo;

    @Column(columnDefinition = "TEXT")
    private String trackOrderInfo;

    @Column(columnDefinition = "TEXT")
    private String needHelpInfo;

    private String facebookUrl;
    @Builder.Default
    private Boolean facebookActive = true;
    private String instagramUrl;
    @Builder.Default
    private Boolean instagramActive = true;
    private String youtubeUrl;
    @Builder.Default
    private Boolean youtubeActive = true;
    private String tiktokUrl;
    @Builder.Default
    private Boolean tiktokActive = true;

    private String storeAddress;
    private String storePhone;
    private String storeEmail;
    private String storeHours;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "store_config_id")
    @Builder.Default
    private List<CustomerReview> customerReviews = new ArrayList<>();
}
