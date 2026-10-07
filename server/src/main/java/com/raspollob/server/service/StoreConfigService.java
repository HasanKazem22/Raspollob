package com.raspollob.server.service;

import com.raspollob.server.dto.StoreConfigRequest;
import com.raspollob.server.dto.StoreConfigResponse;
import com.raspollob.server.dto.CustomerReviewDto;
import com.raspollob.server.entity.StoreConfig;
import com.raspollob.server.entity.CustomerReview;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.repository.StoreConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StoreConfigService {
    private final StoreConfigRepository repository;
    private final MediaCleanupService mediaCleanup;

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
        Set<String> imagesBefore = imagesOf(config);

        // Branding & homepage
        config.setStoreLogo(request.getStoreLogo());
        config.setPrimaryColor(trimToNull(request.getPrimaryColor()));
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
        config.setFooterDescription(trimToNull(request.getFooterDescription()));

        // Checkout & payments
        config.setShippingFeeInsideDhaka(request.getShippingFeeInsideDhaka());
        config.setShippingFeeOutsideDhaka(request.getShippingFeeOutsideDhaka());
        config.setFreeShippingThreshold(request.getFreeShippingThreshold());
        config.setCodEnabled(request.getCodEnabled());
        config.setBkashNumber(trimToNull(request.getBkashNumber()));
        config.setNagadNumber(trimToNull(request.getNagadNumber()));
        config.setRocketNumber(trimToNull(request.getRocketNumber()));
        config.setPaymentInstructions(request.getPaymentInstructions());

        applyOffer(config, request);

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

        // Images removed or replaced in this save: delete their files (unless used elsewhere)
        Set<String> removed = new HashSet<>(imagesBefore);
        removed.removeAll(imagesOf(saved));
        mediaCleanup.deleteIfUnused(removed);

        return mapToResponse(saved);
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Every image the settings point at: logo, banners, offer image and review photos. */
    static Set<String> imagesOf(StoreConfig c) {
        Set<String> images = new HashSet<>();
        images.add(c.getStoreLogo());
        images.add(c.getPromoBannerImage());
        images.add(c.getOfferImage());
        if (c.getHeroBannerImages() != null) {
            images.addAll(c.getHeroBannerImages());
        }
        if (c.getCustomerReviews() != null) {
            c.getCustomerReviews().forEach(r -> images.add(r.getProfileImage()));
        }
        images.remove(null);
        return images;
    }

    // --- Welcome offer popup ---------------------------------------------------

    private static void applyOffer(StoreConfig config, StoreConfigRequest request) {
        boolean enabled = Boolean.TRUE.equals(request.getOfferEnabled());
        String image = trimToNull(request.getOfferImage());
        String link = trimToNull(request.getOfferButtonLink());
        LocalDateTime startsAt = request.getOfferStartsAt();
        LocalDateTime endsAt = request.getOfferEndsAt();

        if (enabled && image == null) {
            throw new BadRequestException("Add an offer image before turning the offer popup on.");
        }
        if (startsAt != null && endsAt != null && !endsAt.isAfter(startsAt)) {
            throw new BadRequestException("The offer must end after it starts.");
        }
        if (link != null && !isSafeLink(link)) {
            throw new BadRequestException("The button link must be a page on this site (starting with /) or an https:// address.");
        }

        config.setOfferEnabled(enabled);
        config.setOfferImage(image);
        config.setOfferTitle(trimToNull(request.getOfferTitle()));
        config.setOfferText(trimToNull(request.getOfferText()));
        String code = trimToNull(request.getOfferPromoCode());
        config.setOfferPromoCode(code == null ? null : PromoCodeService.normalize(code));
        config.setOfferButtonText(trimToNull(request.getOfferButtonText()));
        config.setOfferButtonLink(link);
        config.setOfferStartsAt(startsAt);
        config.setOfferEndsAt(endsAt);
    }

    /** Same-site paths ("/category/honey", not "//evil.com") or https:// URLs; never javascript: etc. */
    static boolean isSafeLink(String link) {
        if (link.startsWith("/")) {
            return !link.startsWith("//") && !link.startsWith("/\\");
        }
        return link.regionMatches(true, 0, "https://", 0, "https://".length()) && link.length() > "https://".length();
    }

    /** Whether visitors should see the popup right now (store-local time). */
    static boolean isOfferActive(StoreConfig c, LocalDateTime now) {
        return Boolean.TRUE.equals(c.getOfferEnabled())
                && c.getOfferImage() != null
                && (c.getOfferStartsAt() == null || !now.isBefore(c.getOfferStartsAt()))
                && (c.getOfferEndsAt() == null || now.isBefore(c.getOfferEndsAt()));
    }

    private StoreConfigResponse mapToResponse(StoreConfig config) {
        return StoreConfigResponse.builder()
                .id(config.getId())
                .storeLogo(config.getStoreLogo())
                .primaryColor(config.getPrimaryColor())
                .secondaryColor(config.getSecondaryColor())
                .footerDescription(config.getFooterDescription())
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
                .offerEnabled(Boolean.TRUE.equals(config.getOfferEnabled()))
                .offerImage(config.getOfferImage())
                .offerTitle(config.getOfferTitle())
                .offerText(config.getOfferText())
                .offerPromoCode(config.getOfferPromoCode())
                .offerButtonText(config.getOfferButtonText())
                .offerButtonLink(config.getOfferButtonLink())
                .offerStartsAt(config.getOfferStartsAt())
                .offerEndsAt(config.getOfferEndsAt())
                .offerActive(isOfferActive(config, LocalDateTime.now()))
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
