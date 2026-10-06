package com.raspollob.server.service;

import com.raspollob.server.entity.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProductSizesTest {

    @Test
    void normalizesCommonWaysOfWritingASize() {
        assertEquals("250 g", ProductSizes.normalize("250g"));
        assertEquals("250 g", ProductSizes.normalize(" 250  GM "));
        assertEquals("1 kg", ProductSizes.normalize("1KG"));
        assertEquals("1.5 kg", ProductSizes.normalize("1.50 kg"));
        assertEquals("2 L", ProductSizes.normalize("2 litre"));
        assertEquals("500 ml", ProductSizes.normalize("500ML"));
        assertEquals("6 pcs", ProductSizes.normalize("6 pieces"));
    }

    @Test
    void keepsFreeTextAndClearsBlank() {
        assertEquals("Family pack", ProductSizes.normalize("  Family   pack "));
        assertNull(ProductSizes.normalize("   "));
        assertNull(ProductSizes.normalize(null));
    }

    @Test
    void ordersSizesByAmountNotByText() {
        List<String> sorted = Stream.of(size(1, "1 kg", 1200), size(2, "250 g", 350), size(3, "Gift box", 900), size(4, "500 g", 650))
                .sorted(ProductSizes.ORDER)
                .map(Product::getSizeLabel)
                .toList();
        assertEquals(List.of("250 g", "500 g", "1 kg", "Gift box"), sorted);
    }

    private static Product size(long id, String label, int price) {
        Product p = Product.builder().sizeLabel(label).sellingPrice(BigDecimal.valueOf(price)).build();
        p.setId(id);
        return p;
    }
}
