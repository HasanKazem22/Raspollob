package com.raspollob.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Public facing product DTO.
 * Strictly NEVER exposes buyingPrice or sensitive internal profit metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
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
    
    // Pricing
    private BigDecimal sellingPrice;
    private BigDecimal offerPrice;
    private Integer discountPercentage; // Calculated: e.g. 15% off

    // Stock & Flags
    private Integer stockQuantity;
    private Boolean inStock;
    private Boolean isTrending;
    private Boolean isActive;

    // Social Proof / Stars
    private Double averageRating;
    private Integer reviewCount;

    // Category
    private CategoryResponse category;

    // Images
    private String primaryImageUrl;
    private List<ProductImageDto> images;

    private LocalDateTime createdAt;
}

