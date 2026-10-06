package com.raspollob.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Admin facing product DTO.
 * Includes buyingPrice, margin calculations, and audit info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductResponse {
    private Long id;
    private String sku;
    private String name;
    /** Pack size, e.g. "250 g"; null when the item has a single size */
    private String sizeLabel;
    /** name + size, e.g. "Honey 250 g" — use this wherever the item is shown */
    private String displayName;
    /** Shared by all sizes of one item */
    private String variantGroup;
    /** Every size of this item, smallest first (single-product responses only; null in lists) */
    private List<ProductSizeOption> sizes;
    private String slug;
    private String description;
    private String details;
    private String ingredients;

    // Pricing & Margins
    private BigDecimal buyingPrice;
    private BigDecimal sellingPrice;
    private BigDecimal offerPrice;
    private Integer discountPercentage;
    private BigDecimal grossProfit;         // sellingPrice/offerPrice - buyingPrice
    private BigDecimal marginPercentage;    // (grossProfit / sellingPrice) * 100

    // Stock & Flags
    private Integer stockQuantity;
    private Boolean inStock;
    private Boolean isTrending;
    private Boolean isActive;

    // Rating
    private Double averageRating;
    private Integer reviewCount;

    // Category
    private CategoryResponse category;

    // Images
    private String primaryImageUrl;
    private List<ProductImageDto> images;

    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

