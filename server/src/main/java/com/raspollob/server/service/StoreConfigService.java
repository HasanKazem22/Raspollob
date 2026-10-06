package com.raspollob.server.service;

import com.raspollob.server.dto.StoreConfigRequest;
import com.raspollob.server.dto.StoreConfigResponse;
import com.raspollob.server.dto.CustomerReviewDto;
import com.raspollob.server.entity.StoreConfig;
import com.raspollob.server.entity.CustomerReview;
import com.raspollob.server.repository.StoreConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.stream.Collectors;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreConfigService {
    private final StoreConfigRepository repository;

    @Transactional(readOnly = true)
    public StoreConfigResponse getStoreConfig() {
        return mapToResponse(loadConfig());
    }

    /** Current config entity (or an empty one if none was saved yet), for other services. */
    @Transactional(readOnly = true)
    public StoreConfig loadConfig() {
        return repository.findById(1L).orElse(new StoreConfig());
    }

    // --- Checkout settings with defaults applied -------------------------------

    public static BigDecimal shippingFeeInsideDhaka(StoreConfig c) {
        return c.getShippingFeeInsideDhaka() != null ? c.getShippingFeeInsideDhaka() : StoreConfig.DEFAULT_SHIPPING_INSIDE_DHAKA;
    }

    public static BigDecimal shippingFeeOutsideDhaka(StoreConfig c) {
        return c.getShippingFeeOutsideDhaka() != null ? c.getShippingFeeOutsideDhaka() : StoreConfig.DEFAULT_SHIPPING_OUTSIDE_DHAKA;
    }

    public static boolean codEnabled(StoreConfig c) {
        return c.getCodEnabled() == null || c.getCodEnabled();
    }

    /** Null or zero threshold means free shipping is disabled. */
    public static BigDecimal freeShippingThreshold(StoreConfig c) {
        BigDecimal t = c.getFreeShippingThreshold();
        return t != null && t.signum() > 0 ? t : null;
    }

    @Transactional
    public StoreConfigResponse updateStoreConfig(StoreConfigRequest request) {
        StoreConfig config = loadConfig();

        // Branding & homepage
        config.setStoreLogo(request.getStoreLogo());
        config.setPrimaryColor(request.getPrimaryColor());
        config.setSecondaryColor(request.getSecondaryColor());
        config.setHeroBannerImages(request.getHeroBannerImages());
        config.setPromoBannerImage(request.getPromoBannerImage());
        config.setCategorySectionTitle(request.getCategorySectionTitle());
        config.setCategorySectionDesc(request.getCategorySectionDesc());
        config.setTrendingSectionTitle(request.getTrendingSectionTitle());
        config.setTrendingSectionDesc(request.getTrendingSectionDesc());
        config.setJustForYouSectionTitle(request.getJustForYouSectionTitle());
        config.setJustForYouSectionDesc(request.getJustForYouSectionDesc());

        // Info pages
        config.setContactUsInfo(request.getContactUsInfo());
        config.setShippingDeliveryInfo(request.getShippingDeliveryInfo());
        config.setReturnsRefundsInfo(request.getReturnsRefundsInfo());
        config.setFaqsInfo(request.getFaqsInfo());
        config.setTrackOrderInfo(request.getTrackOrderInfo());
        config.setNeedHelpInfo(request.getNeedHelpInfo());

        // Social links
        config.setFacebookUrl(request.getFacebookUrl());
        config.setFacebookActive(request.getFacebookActive());
        config.setInstagramUrl(request.getInstagramUrl());
        config.setInstagramActive(request.getInstagramActive());
        config.setYoutubeUrl(request.getYoutubeUrl());
        config.setYoutubeActive(request.getYoutubeActive());
        config.setTiktokUrl(request.getTiktokUrl());
        config.setTiktokActive(request.getTiktokActive());

        // Store contact
        config.setStoreAddress(request.getStoreAddress());
        config.setStorePhone(request.getStorePhone());
        config.setStoreEmail(request.getStoreEmail());
        config.setStoreHours(request.getStoreHours());

        // Checkout & payments
        config.setShippingFeeInsideDhaka(request.getShippingFeeInsideDhaka());
        config.setShippingFeeOutsideDhaka(request.getShippingFeeOutsideDhaka());
        config.setFreeShippingThreshold(request.getFreeShippingThreshold());
        config.setCodEnabled(request.getCodEnabled());
        config.setBkashNumber(trimToNull(request.getBkashNumber()));
        config.setNagadNumber(trimToNull(request.getNagadNumber()));
        config.setRocketNumber(trimToNull(request.getRocketNumber()));
        config.setPaymentInstructions(request.getPaymentInstructions());

        if (request.getCustomerReviews() != null) {
            config.getCustomerReviews().clear();
            List<CustomerReview> reviews = request.getCustomerReviews().stream()
                    .map(dto -> CustomerReview.builder()
                            .name(dto.getName())
                            .rating(dto.getRating())
                            .comment(dto.getComment())
                            .profileImage(dto.getProfileImage())
                            .build())
                    .collect(Collectors.toList());
            config.getCustomerReviews().addAll(reviews);
        }

        StoreConfig saved = repository.save(config);
        return mapToResponse(saved);
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private StoreConfigResponse mapToResponse(StoreConfig config) {
        return StoreConfigResponse.builder()
                .id(config.getId())
                .storeLogo(config.getStoreLogo())
                .primaryColor(config.getPrimaryColor())
                .secondaryColor(config.getSecondaryColor())
                .heroBannerImages(config.getHeroBannerImages())
                .promoBannerImage(config.getPromoBannerImage())
                .categorySectionTitle(config.getCategorySectionTitle())
                .categorySectionDesc(config.getCategorySectionDesc())
                .trendingSectionTitle(config.getTrendingSectionTitle())
                .trendingSectionDesc(config.getTrendingSectionDesc())
                .justForYouSectionTitle(config.getJustForYouSectionTitle())
                .justForYouSectionDesc(config.getJustForYouSectionDesc())
                .contactUsInfo(config.getContactUsInfo())
                .shippingDeliveryInfo(config.getShippingDeliveryInfo())
                .returnsRefundsInfo(config.getReturnsRefundsInfo())
                .faqsInfo(config.getFaqsInfo())
                .trackOrderInfo(config.getTrackOrderInfo())
                .needHelpInfo(config.getNeedHelpInfo())
                .facebookUrl(config.getFacebookUrl())
                .facebookActive(config.getFacebookActive())
                .instagramUrl(config.getInstagramUrl())
                .instagramActive(config.getInstagramActive())
                .youtubeUrl(config.getYoutubeUrl())
                .youtubeActive(config.getYoutubeActive())
                .tiktokUrl(config.getTiktokUrl())
                .tiktokActive(config.getTiktokActive())
                .storeAddress(config.getStoreAddress())
                .storePhone(config.getStorePhone())
                .storeEmail(config.getStoreEmail())
                .storeHours(config.getStoreHours())
                .shippingFeeInsideDhaka(shippingFeeInsideDhaka(config))
                .shippingFeeOutsideDhaka(shippingFeeOutsideDhaka(config))
                .freeShippingThreshold(freeShippingThreshold(config))
                .codEnabled(codEnabled(config))
                .bkashNumber(config.getBkashNumber())
                .nagadNumber(config.getNagadNumber())
                .rocketNumber(config.getRocketNumber())
                .paymentInstructions(config.getPaymentInstructions())
                .customerReviews(config.getCustomerReviews() != null ? config.getCustomerReviews().stream()
                        .map(r -> CustomerReviewDto.builder()
                                .name(r.getName())
                                .rating(r.getRating())
                                .comment(r.getComment())
                                .profileImage(r.getProfileImage())
                                .build())
                        .collect(Collectors.toList()) : null)
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
