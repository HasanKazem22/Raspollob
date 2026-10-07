package com.raspollob.server.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class ProductUpdateRequest {

    private String name;

    private Long categoryId;

    private String sku;

    /** Pack size, e.g. "250 g" (required when the item has more than one size) */
    @Size(max = 40, message = "Size can be at most 40 characters")
    private String sizeLabel;

    /** "Same product as": id of a product to link sizes with, 0 to unlink, null to leave as it is */
    private Long sizeOf;

    private String description;

    private String details;

    private String ingredients;

    @DecimalMin(value = "0.00", message = "Buying price cannot be negative")
    private BigDecimal buyingPrice;

    @DecimalMin(value = "0.01", message = "Selling price must be greater than 0")
    private BigDecimal sellingPrice;

    @DecimalMin(value = "0.00", message = "Offer price cannot be negative")
    private BigDecimal offerPrice;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    private Boolean isTrending;

    private Boolean isActive;

    @DecimalMin(value = "1.0", message = "Rating must be at least 1.0")
    @DecimalMax(value = "5.0", message = "Rating cannot exceed 5.0")
    private Double averageRating;

    @Min(value = 0, message = "Review count cannot be negative")
    private Integer reviewCount;

    /**
     * Preserved image IDs or new image URLs
     */
    private List<Long> keepImageIds;

    /**
     * Complete, ordered gallery for JSON updates (images uploaded beforehand via /files/upload).
     * When present it replaces the gallery: listed URLs are kept/added, all others removed.
     * Takes precedence over keepImageIds.
     */
    private List<String> imageUrls;

    /** Which of imageUrls is the cover image; defaults to the first */
    private String primaryImageUrl;
}

