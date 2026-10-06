package com.raspollob.server.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_product_slug", columnList = "slug"),
        @Index(name = "idx_product_trending_active", columnList = "is_trending, is_active"),
        @Index(name = "idx_product_category_active", columnList = "category_id, is_active"),
        @Index(name = "idx_product_variant_group", columnList = "variant_group")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Product extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 280)
    private String slug;

    @Column(unique = true, length = 64)
    private String sku;

    /**
     * Size of this pack, e.g. "250 g" or "1 kg". Each size is its own product (own price, stock,
     * SKU and photos) so it can be listed as its own card; sizes of the same item share a variantGroup.
     */
    @Column(name = "size_label", length = 40)
    private String sizeLabel;

    /** Links the sizes of one item (random UUID); null for an item sold in a single size. */
    @Column(name = "variant_group", length = 36)
    private String variantGroup;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(columnDefinition = "TEXT")
    private String ingredients;

    @Column(name = "buying_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal buyingPrice;

    @Column(name = "selling_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "offer_price", precision = 12, scale = 2)
    private BigDecimal offerPrice;

    @Builder.Default
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Builder.Default
    @Column(name = "is_trending", nullable = false)
    private Boolean isTrending = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "average_rating")
    private Double averageRating = 5.0;

    @Builder.Default
    @Column(name = "review_count")
    private Integer reviewCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    /** Name shown to customers and saved on orders: "Honey 250 g", or just "Honey" without a size. */
    public String getDisplayName() {
        return sizeLabel == null || sizeLabel.isBlank() ? name : name + " " + sizeLabel;
    }

    public void addImage(ProductImage image) {
        images.add(image);
        image.setProduct(this);
    }

    public void removeImage(ProductImage image) {
        images.remove(image);
        image.setProduct(null);
    }
}

