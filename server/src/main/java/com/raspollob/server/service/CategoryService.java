package com.raspollob.server.service;

import com.raspollob.server.dto.CategoryRequest;
import com.raspollob.server.dto.CategoryResponse;
import com.raspollob.server.entity.Category;
import com.raspollob.server.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActiveCategories() {
        return categoryRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getNavbarCategories() {
        return categoryRepository.findAllByIsActiveTrueAndShowInNavbarTrueOrderByDisplayOrderAscNameAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getHomeCategories() {
        return categoryRepository.findAllByIsActiveTrueAndShowInHomeTrueOrderByDisplayOrderAscNameAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllAdminCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));
        return mapToResponse(category);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Category not found with slug: " + slug));
        return mapToResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Category with name '" + request.getName() + "' already exists");
        }

        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = toSlug(request.getName());
        } else {
            slug = toSlug(slug);
        }

        if (categoryRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl() == null || request.getImageUrl().isBlank() ? null : request.getImageUrl().trim())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .showInNavbar(request.getShowInNavbar() != null ? request.getShowInNavbar() : false)
                .showInHome(request.getShowInHome() != null ? request.getShowInHome() : true)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Category saved = categoryRepository.save(category);
        return mapToResponse(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));

        if (request.getName() != null && !request.getName().isBlank() && !request.getName().equalsIgnoreCase(category.getName())) {
            if (categoryRepository.existsByName(request.getName())) {
                throw new RuntimeException("Category with name '" + request.getName() + "' already exists");
            }
            category.setName(request.getName().trim());
        }

        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            String newSlug = toSlug(request.getSlug());
            if (!newSlug.equalsIgnoreCase(category.getSlug()) && categoryRepository.existsBySlug(newSlug)) {
                throw new RuntimeException("Category with slug '" + newSlug + "' already exists");
            }
            category.setSlug(newSlug);
        }

        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getImageUrl() != null) {
            // Blank means "remove the thumbnail"; the replaced file is deleted after commit
            String nextImage = request.getImageUrl().isBlank() ? null : request.getImageUrl().trim();
            String previousImage = category.getImageUrl();
            if (previousImage != null && !previousImage.equals(nextImage)) {
                fileStorageService.deleteFilesAfterCommit(List.of(previousImage));
            }
            category.setImageUrl(nextImage);
        }
        if (request.getDisplayOrder() != null) category.setDisplayOrder(request.getDisplayOrder());
        if (request.getShowInNavbar() != null) category.setShowInNavbar(request.getShowInNavbar());
        if (request.getShowInHome() != null) category.setShowInHome(request.getShowInHome());
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());

        Category updated = categoryRepository.save(category);
        return mapToResponse(updated);
    }

    @Transactional
    public CategoryResponse toggleShowInNavbar(Long id, boolean show) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));
        category.setShowInNavbar(show);
        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse toggleShowInHome(Long id, boolean show) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));
        category.setShowInHome(show);
        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));

        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new RuntimeException("Cannot delete category because it contains " + category.getProducts().size() + " products. Reassign or delete products first.");
        }

        categoryRepository.delete(category);
        if (category.getImageUrl() != null) {
            fileStorageService.deleteFilesAfterCommit(List.of(category.getImageUrl()));
        }
    }

    public CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .displayOrder(category.getDisplayOrder())
                .showInNavbar(category.getShowInNavbar())
                .showInHome(category.getShowInHome())
                .isActive(category.getIsActive())
                .productCount(category.getProducts() != null ? category.getProducts().size() : 0)
                .createdAt(category.getCreatedAt())
                .build();
    }

    public static String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}

