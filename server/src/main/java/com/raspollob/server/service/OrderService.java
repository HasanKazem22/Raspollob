package com.raspollob.server.service;

import com.raspollob.server.dto.order.*;
import com.raspollob.server.entity.*;
import com.raspollob.server.entity.enums.*;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.repository.OrderRepository;
import com.raspollob.server.repository.ProductRepository;
import com.raspollob.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final String ORDER_PREFIX = "RP";
    // No 0/O/1/I/L to keep order numbers easy to read out over the phone
    private static final char[] ORDER_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PromoCodeService promoCodeService;
    private final StoreConfigService storeConfigService;

    // =========================================================================
    // Customer: quote, place, track
    // =========================================================================

    /** Prices a cart with current product prices, shipping and an optional promo code. Never fails on the promo. */
    @Transactional(readOnly = true)
    public OrderQuoteResponse quote(OrderQuoteRequest request) {
        StoreConfig config = storeConfigService.loadConfig();
        List<PricedLine> lines = priceLines(request.getItems(), false);
        BigDecimal subtotal = sum(lines);
        BigDecimal shippingFee = shippingFee(config, request.getDeliveryZone(), subtotal);

        BigDecimal discount = BigDecimal.ZERO;
        String appliedCode = null;
        String promoError = null;
        if (hasText(request.getPromoCode())) {
            try {
                User user = currentUser();
                PromoCode promo = promoCodeService.validateForOrder(
                        request.getPromoCode(), subtotal, user != null ? user.getId() : null,
                        hasText(request.getPhone()) ? normalizePhone(request.getPhone()) : null);
                discount = PromoCodeService.calculateDiscount(promo, subtotal);
                appliedCode = promo.getCode();
            } catch (BadRequestException e) {
                promoError = e.getMessage();
            }
        }

        return OrderQuoteResponse.builder()
                .lines(lines.stream().map(l -> OrderQuoteResponse.Line.builder()
                        .productId(l.product.getId())
                        .name(l.product.getDisplayName())
                        .imageUrl(primaryImage(l.product))
                        .unitPrice(l.unitPrice)
                        .quantity(l.quantity)
                        .lineTotal(l.lineTotal())
                        .availableStock(l.product.getStockQuantity())
                        .build()).toList())
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(discount)
                .total(subtotal.subtract(discount).add(shippingFee).max(BigDecimal.ZERO))
                .promoCode(appliedCode)
                .promoError(promoError)
                .freeShippingThreshold(StoreConfigService.freeShippingThreshold(config))
                .build();
    }

    /**
     * Creates an order. Everything is re-priced and re-validated here; stock is reserved and the
     * promo use counted in the same transaction (optimistic locking guards concurrent buyers).
     */
    @Transactional
    public OrderResponse placeOrder(CheckoutRequest request) {
        // Idempotency: a repeated submission (double click, retry) returns the original order
        Optional<Order> existing = orderRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (existing.isPresent()) {
            return toResponse(existing.get(), false);
        }

        StoreConfig config = storeConfigService.loadConfig();
        User user = currentUser();

        validatePaymentMethod(config, request);

        Address shipping = toAddress(request.getShippingAddress());
        boolean billingSame = !Boolean.FALSE.equals(request.getBillingSameAsShipping());
        if (!billingSame && request.getBillingAddress() == null) {
            throw new BadRequestException("Billing address is required.");
        }
        Address billing = billingSame ? copy(shipping) : toAddress(request.getBillingAddress());

        // Price and reserve stock
        List<PricedLine> lines = priceLines(request.getItems(), true);
        for (PricedLine line : lines) {
            line.product.setStockQuantity(line.product.getStockQuantity() - line.quantity);
        }
        BigDecimal subtotal = sum(lines);
        BigDecimal shippingFee = shippingFee(config, request.getDeliveryZone(), subtotal);

        // Promo code (one per order)
        PromoCode promo = null;
        BigDecimal discount = BigDecimal.ZERO;
        if (hasText(request.getPromoCode())) {
            promo = promoCodeService.validateForOrder(
                    request.getPromoCode(), subtotal, user != null ? user.getId() : null, shipping.getPhone());
            discount = PromoCodeService.calculateDiscount(promo, subtotal);
            promo.setUsedCount(promo.getUsedCount() + 1);
        }

        PaymentMethod method = request.getPaymentMethod();
        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .idempotencyKey(request.getIdempotencyKey())
                .user(user != null ? userRepository.getReferenceById(user.getId()) : null)
                .status(OrderStatus.PENDING)
                .shippingAddress(shipping)
                .billingSameAsShipping(billingSame)
                .billingAddress(billing)
                .deliveryZone(request.getDeliveryZone())
                .paymentMethod(method)
                .paymentStatus(method.isOnline() ? PaymentStatus.PENDING_VERIFICATION : PaymentStatus.UNPAID)
                .transactionId(method.isOnline() ? request.getTransactionId().trim() : null)
                .paymentSenderNumber(method.isOnline() ? normalizePhone(request.getPaymentSenderNumber()) : null)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(discount)
                .total(subtotal.subtract(discount).add(shippingFee).max(BigDecimal.ZERO))
                .itemCount(lines.stream().mapToInt(l -> l.quantity).sum())
                .promoCode(promo)
                .promoCodeText(promo != null ? promo.getCode() : null)
                .customerNote(trimToNull(request.getCustomerNote()))
                .build();

        for (PricedLine line : lines) {
            order.addItem(OrderItem.builder()
                    .productId(line.product.getId())
                    .productName(line.product.getDisplayName())
                    .sku(line.product.getSku())
                    .imageUrl(primaryImage(line.product))
                    .unitPrice(line.unitPrice)
                    .quantity(line.quantity)
                    .lineTotal(line.lineTotal())
                    .unitCost(line.product.getBuyingPrice())
                    .build());
        }
        order.addHistory(OrderStatusHistory.builder()
                .status(OrderStatus.PENDING)
                .paymentStatus(order.getPaymentStatus())
                .note("Order placed")
                .changedBy(user != null ? user.getUsername() : "customer")
                .build());

        return toResponse(orderRepository.save(order), false);
    }

    /** Public lookup; the phone number must match the shipping phone. */
    @Transactional(readOnly = true)
    public OrderResponse track(String orderNumber, String phone) {
        Order order = orderRepository.findByOrderNumber(orderNumber == null ? "" : orderNumber.trim().toUpperCase(Locale.ROOT))
                .filter(o -> hasText(phone) && o.getShippingAddress().getPhone().equals(normalizePhone(phone)))
                .orElseThrow(() -> new ResourceNotFoundException("No order found with that order number and phone."));
        return toResponse(order, false);
    }

    // =========================================================================
    // Admin
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> search(OrderStatus status, String query, int page, int size) {
        String pattern = hasText(query)
                ? "%" + query.trim().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
                : null;
        return orderRepository.searchAdmin(status, pattern,
                        PageRequest.of(page, Math.min(size, 200), Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public OrderResponse getForAdmin(Long id) {
        return toResponse(find(id), true);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatusUpdateRequest request) {
        Order order = find(id);
        OrderStatus current = order.getStatus();
        OrderStatus next = request.getStatus();

        if (current == next) {
            throw new BadRequestException("The order is already " + label(next) + ".");
        }
        if (!current.canMoveTo(next)) {
            throw new BadRequestException("An order can't go from " + label(current) + " to " + label(next) + ".");
        }

        if (next.releasesInventory()) {
            restock(order);
            if (next == OrderStatus.CANCELLED && order.getPromoCode() != null) {
                PromoCode promo = order.getPromoCode();
                promo.setUsedCount(Math.max(0, promo.getUsedCount() - 1));
            }
        }
        order.setStatus(next);

        // Cash on delivery is collected on delivery
        PaymentStatus paymentChange = null;
        if (next == OrderStatus.DELIVERED && order.getPaymentMethod() == PaymentMethod.COD
                && order.getPaymentStatus() == PaymentStatus.UNPAID) {
            order.setPaymentStatus(PaymentStatus.PAID);
            paymentChange = PaymentStatus.PAID;
        }

        order.addHistory(OrderStatusHistory.builder()
                .status(next)
                .paymentStatus(paymentChange)
                .note(trimToNull(request.getNote()))
                .changedBy(actorName())
                .build());
        return toResponse(orderRepository.saveAndFlush(order), true);
    }

    @Transactional
    public OrderResponse updatePaymentStatus(Long id, PaymentStatusUpdateRequest request) {
        Order order = find(id);
        if (order.getPaymentStatus() == request.getPaymentStatus()) {
            throw new BadRequestException("Payment is already " + label(request.getPaymentStatus()) + ".");
        }
        order.setPaymentStatus(request.getPaymentStatus());
        order.addHistory(OrderStatusHistory.builder()
                .paymentStatus(request.getPaymentStatus())
                .note(trimToNull(request.getNote()))
                .changedBy(actorName())
                .build());
        return toResponse(orderRepository.saveAndFlush(order), true);
    }

    @Transactional
    public OrderResponse updateAdminNote(Long id, AdminNoteRequest request) {
        Order order = find(id);
        order.setAdminNote(trimToNull(request.getAdminNote()));
        return toResponse(order, true);
    }

    // =========================================================================
    // Pricing helpers
    // =========================================================================

    private record PricedLine(Product product, int quantity, BigDecimal unitPrice) {
        BigDecimal lineTotal() {
            return unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    /**
     * Loads products, merges duplicate lines and applies the current price.
     *
     * @param enforceStock throw when a product is unavailable or short on stock (checkout);
     *                     otherwise silently skip unavailable products (quote)
     */
    private List<PricedLine> priceLines(List<CartLineRequest> items, boolean enforceStock) {
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (CartLineRequest item : items) {
            quantities.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }

        Map<Long, Product> products = productRepository.findAllById(quantities.keySet()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<PricedLine> lines = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Product product = products.get(entry.getKey());
            int qty = entry.getValue();

            if (product == null || !Boolean.TRUE.equals(product.getIsActive())) {
                if (enforceStock) {
                    throw new BadRequestException("An item in your cart is no longer available. Please remove it and try again.");
                }
                continue;
            }
            if (enforceStock && product.getStockQuantity() < qty) {
                throw new BadRequestException(product.getStockQuantity() <= 0
                        ? "\"" + product.getDisplayName() + "\" is out of stock."
                        : "Only " + product.getStockQuantity() + " of \"" + product.getDisplayName() + "\" left in stock.");
            }
            lines.add(new PricedLine(product, qty, currentPrice(product)));
        }

        if (enforceStock && lines.isEmpty()) {
            throw new BadRequestException("Your cart is empty.");
        }
        return lines;
    }

    /** Offer price when it's a real discount, otherwise the regular price. */
    private static BigDecimal currentPrice(Product p) {
        BigDecimal offer = p.getOfferPrice();
        return offer != null && offer.signum() > 0 && offer.compareTo(p.getSellingPrice()) < 0
                ? offer
                : p.getSellingPrice();
    }

    private static BigDecimal sum(List<PricedLine> lines) {
        return lines.stream().map(PricedLine::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal shippingFee(StoreConfig config, DeliveryZone zone, BigDecimal subtotal) {
        BigDecimal threshold = StoreConfigService.freeShippingThreshold(config);
        if (threshold != null && subtotal.compareTo(threshold) >= 0) {
            return BigDecimal.ZERO;
        }
        return zone == DeliveryZone.INSIDE_DHAKA
                ? StoreConfigService.shippingFeeInsideDhaka(config)
                : StoreConfigService.shippingFeeOutsideDhaka(config);
    }

    private void validatePaymentMethod(StoreConfig config, CheckoutRequest request) {
        PaymentMethod method = request.getPaymentMethod();
        boolean enabled = switch (method) {
            case COD -> StoreConfigService.codEnabled(config);
            case BKASH -> hasText(config.getBkashNumber());
            case NAGAD -> hasText(config.getNagadNumber());
            case ROCKET -> hasText(config.getRocketNumber());
        };
        if (!enabled) {
            throw new BadRequestException("This payment method is not available right now.");
        }
        if (!method.isOnline()) {
            return;
        }
        if (!hasText(request.getTransactionId())) {
            throw new BadRequestException("Enter the transaction ID from your payment.");
        }
        if (!hasText(request.getPaymentSenderNumber())
                || !request.getPaymentSenderNumber().trim().matches(AddressDto.BD_PHONE_REGEX)) {
            throw new BadRequestException("Enter the mobile number you paid from.");
        }
        if (orderRepository.existsActiveByTransactionId(request.getTransactionId().trim())) {
            throw new BadRequestException("This transaction ID was already used for another order.");
        }
    }

    private void restock(Order order) {
        Map<Long, Integer> quantities = order.getItems().stream()
                .collect(Collectors.toMap(OrderItem::getProductId, OrderItem::getQuantity, Integer::sum));
        // Products deleted since the order was placed are skipped
        for (Product product : productRepository.findAllById(quantities.keySet())) {
            product.setStockQuantity(product.getStockQuantity() + quantities.get(product.getId()));
        }
    }

    // =========================================================================
    // Misc helpers
    // =========================================================================

    private Order find(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));
    }

    private String generateOrderNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(ORDER_PREFIX).append(date).append('-');
            for (int i = 0; i < 4; i++) {
                sb.append(ORDER_CODE_ALPHABET[RANDOM.nextInt(ORDER_CODE_ALPHABET.length)]);
            }
            String candidate = sb.toString();
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique order number");
    }

    /** Signed-in user from the JWT filter, or null for guests. */
    private static User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof User user ? user : null;
    }

    private static String actorName() {
        User user = currentUser();
        return user != null ? user.getUsername() : "system";
    }

    /** "+8801712345678" / "8801712345678" / "01712345678" → "01712345678". */
    static String normalizePhone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("\\D", "");
        return digits.startsWith("88") && digits.length() == 13 ? digits.substring(2) : digits;
    }

    private static Address toAddress(AddressDto dto) {
        return Address.builder()
                .fullName(dto.getFullName().trim())
                .phone(normalizePhone(dto.getPhone()))
                .email(trimToNull(dto.getEmail()))
                .addressLine(dto.getAddressLine().trim())
                .area(trimToNull(dto.getArea()))
                .city(dto.getCity().trim())
                .postalCode(trimToNull(dto.getPostalCode()))
                .build();
    }

    private static Address copy(Address a) {
        return Address.builder()
                .fullName(a.getFullName()).phone(a.getPhone()).email(a.getEmail())
                .addressLine(a.getAddressLine()).area(a.getArea()).city(a.getCity()).postalCode(a.getPostalCode())
                .build();
    }

    private static AddressDto toDto(Address a) {
        if (a == null) return null;
        return AddressDto.builder()
                .fullName(a.getFullName()).phone(a.getPhone()).email(a.getEmail())
                .addressLine(a.getAddressLine()).area(a.getArea()).city(a.getCity()).postalCode(a.getPostalCode())
                .build();
    }

    private static String primaryImage(Product p) {
        return p.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .findFirst()
                .or(() -> p.getImages().stream().findFirst())
                .map(ProductImage::getImageUrl)
                .orElse(null);
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String trimToNull(String s) {
        return hasText(s) ? s.trim() : null;
    }

    private static String label(Enum<?> e) {
        String s = e.name().replace('_', ' ').toLowerCase(Locale.ROOT);
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    // =========================================================================
    // Mapping
    // =========================================================================

    private OrderSummaryResponse toSummary(Order o) {
        return OrderSummaryResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .customerName(o.getShippingAddress().getFullName())
                .customerPhone(o.getShippingAddress().getPhone())
                .city(o.getShippingAddress().getCity())
                .itemCount(o.getItemCount())
                .total(o.getTotal())
                .status(o.getStatus())
                .paymentMethod(o.getPaymentMethod())
                .paymentStatus(o.getPaymentStatus())
                .createdAt(o.getCreatedAt())
                .build();
    }

    /** @param adminView include internal fields (admin note, who changed what, next statuses) */
    private OrderResponse toResponse(Order o, boolean adminView) {
        return OrderResponse.builder()
                .id(adminView ? o.getId() : null)
                .orderNumber(o.getOrderNumber())
                .status(o.getStatus())
                .allowedNextStatuses(adminView ? List.copyOf(o.getStatus().allowedNext()) : null)
                .shippingAddress(toDto(o.getShippingAddress()))
                .billingSameAsShipping(o.getBillingSameAsShipping())
                .billingAddress(toDto(o.getBillingAddress()))
                .deliveryZone(o.getDeliveryZone())
                .paymentMethod(o.getPaymentMethod())
                .paymentStatus(o.getPaymentStatus())
                .transactionId(o.getTransactionId())
                .paymentSenderNumber(o.getPaymentSenderNumber())
                .items(o.getItems().stream().map(i -> OrderResponse.Item.builder()
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .sku(i.getSku())
                        .imageUrl(i.getImageUrl())
                        .unitPrice(i.getUnitPrice())
                        .quantity(i.getQuantity())
                        .lineTotal(i.getLineTotal())
                        .build()).toList())
                .itemCount(o.getItemCount())
                .subtotal(o.getSubtotal())
                .shippingFee(o.getShippingFee())
                .discountAmount(o.getDiscountAmount())
                .total(o.getTotal())
                .promoCode(o.getPromoCodeText())
                .customerNote(o.getCustomerNote())
                .adminNote(adminView ? o.getAdminNote() : null)
                .customerUsername(adminView && o.getUser() != null ? o.getUser().getUsername() : null)
                .history(o.getStatusHistory().stream().map(h -> OrderResponse.HistoryEntry.builder()
                        .status(h.getStatus())
                        .paymentStatus(h.getPaymentStatus())
                        .note(adminView ? h.getNote() : null)
                        .changedBy(adminView ? h.getChangedBy() : null)
                        .createdAt(h.getCreatedAt())
                        .build()).toList())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
