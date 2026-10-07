package com.raspollob.server.service;

import com.raspollob.server.dto.ProductUpdateRequest;
import com.raspollob.server.entity.Product;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.repository.CategoryRepository;
import com.raspollob.server.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** "Same product as": linking and unlinking sizes. */
class ProductSizeLinkTest {

    private final ProductRepository products = mock(ProductRepository.class);
    private final ProductService service = new ProductService(
            products, mock(CategoryRepository.class), mock(CategoryService.class), mock(FileStorageService.class),
            mock(MediaCleanupService.class));

    private final List<Product> db = new ArrayList<>();
    private Product small;
    private Product medium;
    private Product large;

    @BeforeEach
    void setUp() {
        small = product(1, "250 g");
        medium = product(2, "500 g");
        large = product(3, "1 kg");
        when(products.findById(anyLong())).thenAnswer(inv ->
                db.stream().filter(p -> p.getId().equals(inv.getArgument(0))).findFirst());
        when(products.findByVariantGroup(anyString())).thenAnswer(inv ->
                db.stream().filter(p -> Objects.equals(p.getVariantGroup(), inv.getArgument(0))).toList());
        when(products.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void linkingTwoProductsGivesThemTheSameGroup() {
        service.updateProduct(2L, link(1L), null);

        assertThat(medium.getVariantGroup()).isNotNull().isEqualTo(small.getVariantGroup());
    }

    @Test
    void linkingToAnyMemberJoinsTheWholeGroup() {
        service.updateProduct(2L, link(1L), null);
        service.updateProduct(3L, link(2L), null);

        assertThat(large.getVariantGroup()).isEqualTo(small.getVariantGroup()).isEqualTo(medium.getVariantGroup());
    }

    @Test
    void unlinkingTheLastPairLeavesBothAsNormalProducts() {
        service.updateProduct(2L, link(1L), null);
        service.updateProduct(2L, link(0L), null);

        assertThat(medium.getVariantGroup()).isNull();
        assertThat(small.getVariantGroup()).isNull();
    }

    @Test
    void unlinkingOneOfThreeKeepsTheOtherTwoLinked() {
        service.updateProduct(2L, link(1L), null);
        service.updateProduct(3L, link(1L), null);
        service.updateProduct(3L, link(0L), null);

        assertThat(large.getVariantGroup()).isNull();
        assertThat(small.getVariantGroup()).isNotNull().isEqualTo(medium.getVariantGroup());
    }

    @Test
    void rejectsTwoLinkedProductsWithTheSameSize() {
        Product duplicate = product(4, "250g");

        assertThatThrownBy(() -> service.updateProduct(4L, link(1L), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("250 g");
        assertThat(duplicate.getVariantGroup()).isNull();
    }

    @Test
    void needsASizeOnBothProducts() {
        Product noSize = product(5, null);

        assertThatThrownBy(() -> service.updateProduct(5L, link(1L), null)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.updateProduct(1L, link(5L), null)).isInstanceOf(BadRequestException.class);
        assertThat(noSize.getVariantGroup()).isNull();
    }

    @Test
    void editingOtherFieldsKeepsTheLink() {
        service.updateProduct(2L, link(1L), null);
        String group = medium.getVariantGroup();

        ProductUpdateRequest rename = new ProductUpdateRequest();
        rename.setName("Sundarban Honey");
        service.updateProduct(2L, rename, null);

        assertThat(medium.getVariantGroup()).isEqualTo(group);
        assertThat(small.getName()).isEqualTo("Honey"); // other sizes keep their own details
    }

    private Product product(long id, String size) {
        Product p = Product.builder()
                .name("Honey")
                .sizeLabel(size == null ? null : ProductSizes.normalize(size))
                .buyingPrice(BigDecimal.ONE)
                .sellingPrice(BigDecimal.TEN)
                .build();
        p.setId(id);
        db.add(p);
        return p;
    }

    private static ProductUpdateRequest link(long targetId) {
        ProductUpdateRequest r = new ProductUpdateRequest();
        r.setSizeOf(targetId);
        return r;
    }
}
