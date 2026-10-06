package com.raspollob.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** One size of an item, for the size picker on the product page and the admin form. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSizeOption {
    private Long id;
    private String sizeLabel;
    private BigDecimal sellingPrice;
    private BigDecimal offerPrice;
    private Boolean inStock;
    private String primaryImageUrl;
    /** Admin only (null on public responses): lets the form show hidden sizes */
    private Boolean isActive;
    /** Admin only (null on public responses) */
    private Integer stockQuantity;
}
