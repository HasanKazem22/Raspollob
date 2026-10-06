package com.raspollob.server.controller;

import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.CategoryRequest;
import com.raspollob.server.dto.CategoryResponse;
import com.raspollob.server.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;

    @PreAuthorize("@perm.has('product.subModules.category.isAccess')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllAdminCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Categories retrieved successfully"));
    }

    @PreAuthorize("@perm.has('product.subModules.category.actions.create')")
    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(category, "Category created successfully"));
    }

    @PreAuthorize("@perm.has('product.subModules.category.actions.update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success(category, "Category updated successfully"));
    }

    @PreAuthorize("@perm.has('product.subModules.category.actions.update')")
    @PatchMapping("/{id}/toggle-navbar")
    public ResponseEntity<ApiResponse<CategoryResponse>> toggleNavbar(
            @PathVariable Long id,
            @RequestParam boolean show) {
        CategoryResponse category = categoryService.toggleShowInNavbar(id, show);
        return ResponseEntity.ok(ApiResponse.success(category, "Navbar visibility updated"));
    }

    @PreAuthorize("@perm.has('product.subModules.category.actions.update')")
    @PatchMapping("/{id}/toggle-home")
    public ResponseEntity<ApiResponse<CategoryResponse>> toggleHome(
            @PathVariable Long id,
            @RequestParam boolean show) {
        CategoryResponse category = categoryService.toggleShowInHome(id, show);
        return ResponseEntity.ok(ApiResponse.success(category, "Home visibility updated"));
    }

    @PreAuthorize("@perm.has('product.subModules.category.actions.delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }
}
