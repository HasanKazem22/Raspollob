package com.raspollob.server.service;

import com.raspollob.server.dto.ProductResponse;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs the public catalogue query (used by the category page) with every sort option
 * against a real database, so a broken ORDER BY fails here instead of in the shop.
 * Read-only.
 */
@SpringBootTest
@Transactional
class ProductCatalogQueryTest {

    @Autowired
    private ProductService productService;

    @ParameterizedTest
    @CsvSource({
            "createdAt, DESC",
            "price, ASC",
            "price, DESC",
            "name, ASC",
            "rating, DESC",
            // Unknown values fall back to the default sort instead of failing
            "password, ASC",
    })
    void everySortOptionRuns(String sortBy, String sortDir) {
        Page<ProductResponse> page = productService.getPublicProducts(null, null, 0, 5, sortBy, sortDir);
        assertThat(page.getSize()).isEqualTo(5);
    }

    @ParameterizedTest
    @CsvSource({"-3, 1000"})
    void pageArgumentsAreClamped(int page, int size) {
        Page<ProductResponse> result = productService.getPublicProducts(null, "honey", page, size, "price", "ASC");
        assertThat(result.getNumber()).isZero();
        assertThat(result.getSize()).isEqualTo(48);
    }
}
