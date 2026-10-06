package com.raspollob.server.controller;

import com.raspollob.server.dto.AdminProductResponse;
import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.ProductCreateRequest;
import com.raspollob.server.dto.ProductUpdateRequest;
import com.raspollob.server.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @PreAuthorize("@perm.has('product.isAccess')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminProductResponse>>> getAdminProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<AdminProductResponse> products = productService.getAdminProducts(categoryId, query, page, size);
        return ResponseEntity.ok(ApiResponse.success(products, "Admin products retrieved successfully"));
    }

    @PreAuthorize("@perm.has('product.isAccess')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminProductResponse>> getAdminProduct(@PathVariable Long id) {
        AdminProductResponse product = productService.getAdminProduct(id);
        return ResponseEntity.ok(ApiResponse.success(product, "Product details retrieved successfully"));
    }

    /**
     * Create product with multipart image upload (Min 2, Max 5 images enforced).
     */
    @PreAuthorize("@perm.has('product.actions.create')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AdminProductResponse>> createProductMultipart(
            @Valid @RequestPart("product") ProductCreateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        AdminProductResponse created = productService.createProduct(request, images);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Product created successfully"));
    }

    /**
     * Create product with JSON payload (e.g. pre-uploaded image URLs).
     */
    @PreAuthorize("@perm.has('product.actions.create')")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<AdminProductResponse>> createProductJson(
            @Valid @RequestBody ProductCreateRequest request) {
        AdminProductResponse created = productService.createProduct(request, null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Product created successfully"));
    }

    /**
     * Update product details and optionally upload new images or replace old ones.
     */
    @PreAuthorize("@perm.has('product.actions.update')")
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AdminProductResponse>> updateProductMultipart(
            @PathVariable Long id,
            @Valid @RequestPart("product") ProductUpdateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        AdminProductResponse updated = productService.updateProduct(id, request, images);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product updated successfully"));
    }

    @PreAuthorize("@perm.has('product.actions.update')")
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<AdminProductResponse>> updateProductJson(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        AdminProductResponse updated = productService.updateProduct(id, request, null);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product updated successfully"));
    }

    /**
     * Quick toggle for isTrending directly from frontend table row.
     */
    @PreAuthorize("@perm.has('product.actions.update')")
    @PatchMapping("/{id}/trending")
    public ResponseEntity<ApiResponse<AdminProductResponse>> toggleTrending(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> payload) {
        boolean isTrending = Boolean.TRUE.equals(payload.get("isTrending"));
        AdminProductResponse updated = productService.toggleTrending(id, isTrending);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product trending status updated successfully"));
    }

    /**
     * Delete product.
     * Strategy C: Automatically deletes all physical images from host storage.
     */
    @PreAuthorize("@perm.has('product.actions.delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Product and associated image files deleted successfully"));
    }
}

