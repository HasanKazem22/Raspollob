package com.raspollob.server.service;

import com.raspollob.server.entity.Product;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pack sizes ("250 g", "1 kg", "500 ml"): tidies what admins type and orders sizes by amount,
 * so 250 g comes before 500 g and 1 kg however they were created.
 */
public final class ProductSizes {

    private static final Pattern AMOUNT = Pattern.compile(
            "^(\\d+(?:\\.\\d+)?)\\s*(g|gm|gms|gram|grams|kg|kgs|ml|l|ltr|litre|liter|pc|pcs|piece|pieces)$",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    /** Canonical unit and how many base units (g, ml, pcs) one of it holds. */
    private record Unit(String label, double base) {
    }

    private static final Map<String, Unit> UNITS = Map.ofEntries(
            Map.entry("g", new Unit("g", 1)), Map.entry("gm", new Unit("g", 1)), Map.entry("gms", new Unit("g", 1)),
            Map.entry("gram", new Unit("g", 1)), Map.entry("grams", new Unit("g", 1)),
            Map.entry("kg", new Unit("kg", 1000)), Map.entry("kgs", new Unit("kg", 1000)),
            Map.entry("ml", new Unit("ml", 1)),
            Map.entry("l", new Unit("L", 1000)), Map.entry("ltr", new Unit("L", 1000)),
            Map.entry("litre", new Unit("L", 1000)), Map.entry("liter", new Unit("L", 1000)),
            Map.entry("pc", new Unit("pcs", 1)), Map.entry("pcs", new Unit("pcs", 1)),
            Map.entry("piece", new Unit("pcs", 1)), Map.entry("pieces", new Unit("pcs", 1)));

    /** Sizes in display order: by amount, then price, then age. */
    public static final Comparator<Product> ORDER = Comparator
            .comparingDouble((Product p) -> amount(p.getSizeLabel()))
            .thenComparing(ProductSizes::effectivePrice)
            .thenComparing(Product::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    private ProductSizes() {
    }

    /** "250G" → "250 g", "1kg" → "1 kg", "2 Litre" → "2 L"; other text is kept (trimmed); blank → null. */
    public static String normalize(String label) {
        if (label == null || label.isBlank()) {
            return null;
        }
        String trimmed = WHITESPACE.matcher(label.trim()).replaceAll(" ");
        Matcher m = AMOUNT.matcher(trimmed);
        if (!m.matches()) {
            return trimmed;
        }
        String number = new BigDecimal(m.group(1)).stripTrailingZeros().toPlainString();
        return number + " " + UNITS.get(m.group(2).toLowerCase(Locale.ROOT)).label();
    }

    /** Amount in base units for sorting; sizes that aren't a plain amount sort last. */
    static double amount(String label) {
        if (label == null) {
            return Double.MAX_VALUE;
        }
        Matcher m = AMOUNT.matcher(label.trim());
        if (!m.matches()) {
            return Double.MAX_VALUE;
        }
        return Double.parseDouble(m.group(1)) * UNITS.get(m.group(2).toLowerCase(Locale.ROOT)).base();
    }

    private static BigDecimal effectivePrice(Product p) {
        return p.getOfferPrice() != null ? p.getOfferPrice() : p.getSellingPrice();
    }
}
