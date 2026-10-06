package com.raspollob.server.service;

import com.raspollob.server.dto.order.PromoCodeRequest;
import com.raspollob.server.dto.order.PromoCodeResponse;
import com.raspollob.server.entity.PromoCode;
import com.raspollob.server.entity.enums.DiscountType;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.repository.OrderRepository;
import com.raspollob.server.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PromoCodeService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final PromoCodeRepository promoCodeRepository;
    private final OrderRepository orderRepository;

    // =========================================================================
    // Checkout
    // =========================================================================

    public static String normalize(String code) {
        return code == null ? null : code.trim().toUpperCase(Locale.ROOT);
    }

    /**
     * Finds a promo code and checks every rule for this order.
     *
     * @param userId signed-in customer, or null for guests
     * @param phone  normalized shipping phone, or null if not known yet (quote before checkout)
     * @throws BadRequestException with a customer-facing reason when the code can't be used
     */
    public PromoCode validateForOrder(String rawCode, BigDecimal subtotal, Long userId, String phone) {
        PromoCode promo = promoCodeRepository.findByCodeIgnoreCase(normalize(rawCode))
                .orElseThrow(() -> new BadRequestException("This promo code does not exist."));

        LocalDateTime now = LocalDateTime.now();
        if (!Boolean.TRUE.equals(promo.getIsActive())) {
            throw new BadRequestException("This promo code is no longer active.");
        }
        if (promo.getStartsAt() != null && now.isBefore(promo.getStartsAt())) {
            throw new BadRequestException("This promo code is not active yet.");
        }
        if (promo.getExpiresAt() != null && now.isAfter(promo.getExpiresAt())) {
            throw new BadRequestException("This promo code has expired.");
        }
        if (promo.getUsageLimit() != null && promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new BadRequestException("This promo code has reached its usage limit.");
        }
        if (promo.getMinOrderAmount() != null && subtotal.compareTo(promo.getMinOrderAmount()) < 0) {
            throw new BadRequestException("Add items worth at least ৳"
                    + promo.getMinOrderAmount().stripTrailingZeros().toPlainString() + " to use this code.");
        }
        if (userId != null || phone != null) {
            long uses = orderRepository.countPromoUsesByCustomer(promo.getId(), userId, phone);
            if (uses >= promo.getPerCustomerLimit()) {
                throw new BadRequestException("You have already used this promo code.");
            }
        }
        return promo;
    }

    /** Discount on the subtotal, rounded to 2 decimals and never more than the subtotal. */
    public static BigDecimal calculateDiscount(PromoCode promo, BigDecimal subtotal) {
        BigDecimal discount = promo.getDiscountType() == DiscountType.PERCENTAGE
                ? subtotal.multiply(promo.getDiscountValue()).divide(HUNDRED, 2, RoundingMode.HALF_UP)
                : promo.getDiscountValue();

        if (promo.getMaxDiscountAmount() != null && discount.compareTo(promo.getMaxDiscountAmount()) > 0) {
            discount = promo.getMaxDiscountAmount();
        }
        return discount.min(subtotal).setScale(2, RoundingMode.HALF_UP);
    }

    // =========================================================================
    // Admin CRUD
    // =========================================================================

    @Transactional(readOnly = true)
    public List<PromoCodeResponse> list() {
        return promoCodeRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PromoCodeResponse create(PromoCodeRequest request) {
        String code = normalize(request.getCode());
        if (promoCodeRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("A promo code \"" + code + "\" already exists.");
        }
        PromoCode promo = PromoCode.builder().code(code).usedCount(0).build();
        apply(promo, request);
        return toResponse(promoCodeRepository.save(promo));
    }

    @Transactional
    public PromoCodeResponse update(Long id, PromoCodeRequest request) {
        PromoCode promo = find(id);
        String code = normalize(request.getCode());
        if (!promo.getCode().equals(code) && promoCodeRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("A promo code \"" + code + "\" already exists.");
        }
        promo.setCode(code);
        apply(promo, request);
        return toResponse(promoCodeRepository.save(promo));
    }

    @Transactional
    public void delete(Long id) {
        PromoCode promo = find(id);
        if (orderRepository.existsByPromoCode_Id(id)) {
            throw new BadRequestException("This code was used on orders and can't be deleted. Deactivate it instead.");
        }
        promoCodeRepository.delete(promo);
    }

    private PromoCode find(Long id) {
        return promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promo code not found with ID: " + id));
    }

    private void apply(PromoCode promo, PromoCodeRequest r) {
        if (r.getDiscountType() == DiscountType.PERCENTAGE && r.getDiscountValue().compareTo(HUNDRED) > 0) {
            throw new BadRequestException("A percentage discount can't be more than 100%.");
        }
        if (r.getStartsAt() != null && r.getExpiresAt() != null && !r.getExpiresAt().isAfter(r.getStartsAt())) {
            throw new BadRequestException("The end date must be after the start date.");
        }
        promo.setDescription(r.getDescription());
        promo.setDiscountType(r.getDiscountType());
        promo.setDiscountValue(r.getDiscountValue());
        promo.setMaxDiscountAmount(r.getMaxDiscountAmount());
        promo.setMinOrderAmount(r.getMinOrderAmount());
        promo.setStartsAt(r.getStartsAt());
        promo.setExpiresAt(r.getExpiresAt());
        promo.setUsageLimit(r.getUsageLimit());
        promo.setPerCustomerLimit(r.getPerCustomerLimit());
        promo.setIsActive(r.getIsActive());
    }

    private PromoCodeResponse toResponse(PromoCode p) {
        return PromoCodeResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .description(p.getDescription())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .maxDiscountAmount(p.getMaxDiscountAmount())
                .minOrderAmount(p.getMinOrderAmount())
                .startsAt(p.getStartsAt())
                .expiresAt(p.getExpiresAt())
                .usageLimit(p.getUsageLimit())
                .usedCount(p.getUsedCount())
                .perCustomerLimit(p.getPerCustomerLimit())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
