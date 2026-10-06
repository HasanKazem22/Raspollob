package com.raspollob.server.controller;

import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.ProductResponse;
import com.raspollob.server.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * Home Page Trending Section: Top trending active products.
     * Fast indexed query.
     */
    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getTrendingProducts(
            @RequestParam(defaultValue = "10") int limit) {
        List<ProductResponse> trending = productService.getTrendingProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(trending, "Trending products retrieved successfully"));
    }

    /**
     * Public Product Catalog listing with filters and pagination.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Page<ProductResponse> products = productService.getPublicProducts(categoryId, query, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(products, "Products retrieved successfully"));
    }

    /**
     * Public Single Product Details by numeric ID or slug.
     */
    @GetMapping("/{idOrSlug}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable String idOrSlug) {
        ProductResponse product;
        try {
            Long id = Long.parseLong(idOrSlug);
            product = productService.getPublicProduct(id);
        } catch (NumberFormatException e) {
            product = productService.getPublicProductBySlug(idOrSlug);
        }
        return ResponseEntity.ok(ApiResponse.success(product, "Product details retrieved successfully"));
    }
}

