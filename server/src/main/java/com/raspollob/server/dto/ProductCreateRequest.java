package com.raspollob.server.dto;

import jakarta.validation.constraints.*;
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
public class ProductCreateRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String sku;

    /** Pack size, e.g. "250 g" (required when the item has more than one size) */
    @Size(max = 40, message = "Size can be at most 40 characters")
    private String sizeLabel;

    /** "Same product as": id of a product to link sizes with (shown together in the size picker) */
    private Long sizeOf;

    @NotBlank(message = "Product description is required")
    private String description;

    private String details;

    private String ingredients;

    @NotNull(message = "Buying price is required")
    @DecimalMin(value = "0.00", message = "Buying price cannot be negative")
    private BigDecimal buyingPrice;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.01", message = "Selling price must be greater than 0")
    private BigDecimal sellingPrice;

    @DecimalMin(value = "0.00", message = "Offer price cannot be negative")
    private BigDecimal offerPrice;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    @Builder.Default
    private Boolean isTrending = false;

    @Builder.Default
    private Boolean isActive = true;

    @DecimalMin(value = "1.0", message = "Rating must be at least 1.0")
    @DecimalMax(value = "5.0", message = "Rating cannot exceed 5.0")
    @Builder.Default
    private Double averageRating = 5.0;

    @Min(value = 0, message = "Review count cannot be negative")
    @Builder.Default
    private Integer reviewCount = 0;

    /**
     * Optional image URLs if uploaded separately (or min 2 / max 5 images can be passed via Multipart)
     */
    private List<String> imageUrls;

    /** Which of imageUrls is the cover image; defaults to the first */
    private String primaryImageUrl;
}

