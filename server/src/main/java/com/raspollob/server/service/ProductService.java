package com.raspollob.server.service;

import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.dto.*;
import com.raspollob.server.entity.Category;
import com.raspollob.server.entity.Product;
import com.raspollob.server.entity.ProductImage;
import com.raspollob.server.repository.CategoryRepository;
import com.raspollob.server.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final FileStorageService fileStorageService;

    // =========================================================================
    // PUBLIC METHODS (Frontend / Catalog / Home)
    // =========================================================================

    /**
     * Home Page Trending Section: Top active products flagged as isTrending.
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getTrendingProducts(int limit) {
        Pageable pageable = PageRequest.of(0, limit > 0 ? limit : 10);
        return productRepository.findTrendingProducts(pageable).stream()
                .map(this::mapToPublicResponse)
                .collect(Collectors.toList());
    }

    /**
     * Public Product Catalog with search, category filtering, and pagination.
     */
    @Transactional(readOnly = true)
    public Page<ProductResponse> getPublicProducts(Long categoryId, String query, int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir != null ? sortDir : "DESC"), 
                            sortBy != null ? sortBy : "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findPublicProducts(categoryId, toSearchPattern(query), pageable)
                .map(this::mapToPublicResponse);
    }

    /**
     * Public Single Product View by ID or Slug.
     */
    @Transactional(readOnly = true)
    public ProductResponse getPublicProduct(Long id) {
        Product product = productRepository.findById(id)
                .filter(Product::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or inactive with ID: " + id));
        ProductResponse response = mapToPublicResponse(product);
        response.setSizes(sizesOf(product, false));
        return response;
    }

    @Transactional(readOnly = true)
    public ProductResponse getPublicProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .filter(Product::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or inactive with slug: " + slug));
        ProductResponse response = mapToPublicResponse(product);
        response.setSizes(sizesOf(product, false));
        return response;
    }

    // =========================================================================
    // ADMIN METHODS (Management / POS / Staff)
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<AdminProductResponse> getAdminProducts(Long categoryId, String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return productRepository.findAdminProducts(categoryId, toSearchPattern(query), pageable)
                .map(this::mapToAdminResponse);
    }

    /**
     * Turns user search text into a lower-case LIKE pattern ("%text%"), or null when blank.
     * LIKE wildcards typed by the user (% and _) are matched literally.
     */
    private static String toSearchPattern(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        String escaped = query.trim().toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    @Transactional(readOnly = true)
    public AdminProductResponse getAdminProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        return withAdminSizes(product);
    }

    /**
     * Admin: Create Product with uploaded files (Min 2, Max 5 images enforced).
     * With {@code sizeOf} set, the product becomes another size of that item.
     */
    @Transactional
    public AdminProductResponse createProduct(ProductCreateRequest request, List<MultipartFile> imageFiles) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + request.getCategoryId()));

        // Pricing Invariant Validation
        validatePricing(request.getBuyingPrice(), request.getSellingPrice(), request.getOfferPrice());

        // Size family: joining another item gives both the same group id
        String sizeLabel = ProductSizes.normalize(request.getSizeLabel());
        String variantGroup = null;
        if (request.getSizeOf() != null) {
            Product base = productRepository.findById(request.getSizeOf())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getSizeOf()));
            if (base.getSizeLabel() == null) {
                throw new BadRequestException("Give \"" + base.getName() + "\" a size (for example 250 g) before adding another size.");
            }
            variantGroup = base.getVariantGroup() != null ? base.getVariantGroup() : UUID.randomUUID().toString();
            base.setVariantGroup(variantGroup);
        }
        validateSizeInFamily(variantGroup, null, sizeLabel);

        // Slug generation (includes the size so every size gets its own address)
        String slug = CategoryService.toSlug(sizeLabel == null ? request.getName() : request.getName() + " " + sizeLabel);
        if (productRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        // SKU validation or generation
        String sku = request.getSku();
        if (sku == null || sku.isBlank()) {
            sku = "SKU-" + System.currentTimeMillis();
        } else if (productRepository.existsBySku(sku)) {
            throw new RuntimeException("Product with SKU '" + sku + "' already exists");
        }

        // Build Product
        Product product = Product.builder()
                .name(request.getName().trim())
                .slug(slug)
                .sku(sku)
                .sizeLabel(sizeLabel)
                .variantGroup(variantGroup)
                .category(category)
                .description(request.getDescription())
                .details(request.getDetails())
                .ingredients(request.getIngredients())
                .buyingPrice(request.getBuyingPrice())
                .sellingPrice(request.getSellingPrice())
                .offerPrice(request.getOfferPrice())
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .isTrending(request.getIsTrending() != null ? request.getIsTrending() : false)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .averageRating(request.getAverageRating() != null ? request.getAverageRating() : 5.0)
                .reviewCount(request.getReviewCount() != null ? request.getReviewCount() : 0)
                .images(new ArrayList<>())
                .build();

        // Collect Images: Check Min 2, Max 5 rule
        List<String> storedImageNames = new ArrayList<>();
        if (imageFiles != null && !imageFiles.isEmpty()) {
            List<MultipartFile> validFiles = imageFiles.stream()
                    .filter(f -> f != null && !f.isEmpty())
                    .toList();
            if (validFiles.size() < 2 || validFiles.size() > 5) {
                throw new IllegalArgumentException("Product must have between 2 and 5 images. You provided: " + validFiles.size());
            }

            // Strategy A: Resize & compress each file to WebP
            for (MultipartFile file : validFiles) {
                String storedName = fileStorageService.storeFile(file);
                storedImageNames.add(storedName);
            }
        } else if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            if (request.getImageUrls().size() < 2 || request.getImageUrls().size() > 5) {
                throw new IllegalArgumentException("Product must have between 2 and 5 images. You provided: " + request.getImageUrls().size());
            }
            storedImageNames.addAll(request.getImageUrls());
        } else {
            throw new IllegalArgumentException("Product must have between 2 and 5 images.");
        }

        // Attach ProductImage entities; cover = requested primary, else the first image
        int primaryIndex = Math.max(0, storedImageNames.indexOf(request.getPrimaryImageUrl()));
        for (int i = 0; i < storedImageNames.size(); i++) {
            ProductImage pImage = ProductImage.builder()
                    .imageUrl(storedImageNames.get(i))
                    .isPrimary(i == primaryIndex)
                    .displayOrder(i)
                    .altText(product.getDisplayName() + " image " + (i + 1))
                    .build();
            product.addImage(pImage);
        }

        Product saved = productRepository.save(product);
        syncSharedDetails(saved);
        log.info("Created product: {} (ID: {}) with {} images", saved.getDisplayName(), saved.getId(), saved.getImages().size());
        return withAdminSizes(saved);
    }

    /**
     * Admin: Update product details, stock, trending status, and optionally images.
     */
    @Transactional
    public AdminProductResponse updateProduct(Long id, ProductUpdateRequest request, List<MultipartFile> newImageFiles) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            product.setName(request.getName().trim());
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with ID: " + request.getCategoryId()));
            product.setCategory(category);
        }

        if (request.getSku() != null && !request.getSku().isBlank() && !request.getSku().equals(product.getSku())) {
            if (productRepository.existsBySku(request.getSku())) {
                throw new RuntimeException("Product with SKU '" + request.getSku() + "' already exists");
            }
            product.setSku(request.getSku());
        }

        // Size: "" clears it, which is only allowed while the item has no other sizes
        if (request.getSizeLabel() != null) {
            String sizeLabel = ProductSizes.normalize(request.getSizeLabel());
            if (sizeLabel == null && familyOf(product).size() > 1) {
                throw new BadRequestException("This item has other sizes, so it needs a size too (for example 250 g).");
            }
            validateSizeInFamily(product.getVariantGroup(), product.getId(), sizeLabel);
            product.setSizeLabel(sizeLabel);
        }

        BigDecimal buying = request.getBuyingPrice() != null ? request.getBuyingPrice() : product.getBuyingPrice();
        BigDecimal selling = request.getSellingPrice() != null ? request.getSellingPrice() : product.getSellingPrice();
        BigDecimal offer = request.getOfferPrice() != null ? request.getOfferPrice() : product.getOfferPrice();
        validatePricing(buying, selling, offer);

        if (request.getBuyingPrice() != null) product.setBuyingPrice(request.getBuyingPrice());
        if (request.getSellingPrice() != null) product.setSellingPrice(request.getSellingPrice());
        if (request.getOfferPrice() != null) product.setOfferPrice(request.getOfferPrice());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getDetails() != null) product.setDetails(request.getDetails());
        if (request.getIngredients() != null) product.setIngredients(request.getIngredients());
        if (request.getStockQuantity() != null) product.setStockQuantity(request.getStockQuantity());
        if (request.getIsTrending() != null) product.setIsTrending(request.getIsTrending());
        if (request.getIsActive() != null) product.setIsActive(request.getIsActive());
        if (request.getAverageRating() != null) product.setAverageRating(request.getAverageRating());
        if (request.getReviewCount() != null) product.setReviewCount(request.getReviewCount());

        // Images: a full URL list (JSON, admin UI) replaces the gallery; otherwise the
        // multipart flow keeps the listed IDs and appends uploaded files
        if (request.getImageUrls() != null) {
            syncImagesFromUrls(product, request.getImageUrls(), request.getPrimaryImageUrl());
        } else if ((newImageFiles != null && !newImageFiles.isEmpty()) || request.getKeepImageIds() != null) {
            handleImageUpdates(product, request.getKeepImageIds(), newImageFiles);
        }

        Product updated = productRepository.save(product);
        syncSharedDetails(updated);
        return withAdminSizes(updated);
    }

    /**
     * Admin: Delete Product.
     * Strategy C: Automatically deletes all associated physical image files from host disk!
     */
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));

        // Strategy C: Collect physical image files to clean up
        List<String> filesToDelete = product.getImages().stream()
                .map(ProductImage::getImageUrl)
                .toList();

        List<Product> remainingSizes = familyOf(product).stream()
                .filter(p -> !p.getId().equals(product.getId()))
                .toList();

        productRepository.delete(product);

        // A size left on its own is a normal single-size item again
        if (remainingSizes.size() == 1) {
            remainingSizes.get(0).setVariantGroup(null);
        }

        // Delete from disk after DB transaction commits (unless another size still shows the photo)
        deleteFilesIfUnused(filesToDelete);
        log.info("Strategy C: Deleted product {} and physically removed {} images from disk", id, filesToDelete.size());
    }

    /**
     * Admin: Quick Toggle for Trending status directly from table row.
     */
    @Transactional
    public AdminProductResponse toggleTrending(Long id, boolean isTrending) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));
        product.setIsTrending(isTrending);
        Product saved = productRepository.save(product);
        return mapToAdminResponse(saved);
    }

    // =========================================================================
    // SIZES (each size is its own product; sizes of one item share variantGroup)
    // =========================================================================

    /** Every size of this product's item, itself included. */
    private List<Product> familyOf(Product product) {
        return product.getVariantGroup() == null
                ? List.of(product)
                : productRepository.findByVariantGroup(product.getVariantGroup());
    }

    private void validateSizeInFamily(String variantGroup, Long selfId, String sizeLabel) {
        if (variantGroup == null) {
            return;
        }
        if (sizeLabel == null) {
            throw new BadRequestException("Each size needs a name, for example 250 g or 1 kg.");
        }
        boolean taken = productRepository.findByVariantGroup(variantGroup).stream()
                .anyMatch(p -> !p.getId().equals(selfId) && sizeLabel.equalsIgnoreCase(p.getSizeLabel()));
        if (taken) {
            throw new BadRequestException("This item already has a \"" + sizeLabel + "\" size.");
        }
    }

    /** Name, description and category are edited once for all sizes of an item. */
    private void syncSharedDetails(Product source) {
        if (source.getVariantGroup() == null) {
            return;
        }
        for (Product size : productRepository.findByVariantGroup(source.getVariantGroup())) {
            if (size.getId().equals(source.getId())) {
                continue;
            }
            size.setName(source.getName());
            size.setDescription(source.getDescription());
            size.setDetails(source.getDetails());
            size.setIngredients(source.getIngredients());
            size.setCategory(source.getCategory());
        }
    }

    /** Sizes for the picker: public responses list active sizes only. */
    private List<ProductSizeOption> sizesOf(Product product, boolean forAdmin) {
        if (product.getVariantGroup() == null) {
            return List.of();
        }
        return productRepository.findByVariantGroup(product.getVariantGroup()).stream()
                .filter(p -> forAdmin || Boolean.TRUE.equals(p.getIsActive()))
                .sorted(ProductSizes.ORDER)
                .map(p -> ProductSizeOption.builder()
                        .id(p.getId())
                        .sizeLabel(p.getSizeLabel())
                        .sellingPrice(p.getSellingPrice())
                        .offerPrice(p.getOfferPrice())
                        .inStock(p.getStockQuantity() != null && p.getStockQuantity() > 0)
                        .primaryImageUrl(primaryImageOf(p))
                        .isActive(forAdmin ? p.getIsActive() : null)
                        .stockQuantity(forAdmin ? p.getStockQuantity() : null)
                        .build())
                .toList();
    }

    private AdminProductResponse withAdminSizes(Product product) {
        AdminProductResponse response = mapToAdminResponse(product);
        response.setSizes(sizesOf(product, true));
        return response;
    }

    /** Deletes image files after commit, except ones another product (e.g. another size) still uses. */
    private void deleteFilesIfUnused(List<String> files) {
        if (files.isEmpty()) {
            return;
        }
        productRepository.flush(); // apply removed image rows before checking what's still referenced
        Set<String> inUse = new HashSet<>(productRepository.findImageUrlsInUse(files));
        fileStorageService.deleteFilesAfterCommit(files.stream().filter(f -> !inUse.contains(f)).toList());
    }

    private static String primaryImageOf(Product product) {
        return product.getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl());
    }

    // =========================================================================
    // HELPER & MAPPING METHODS
    // =========================================================================

    private void validatePricing(BigDecimal buyingPrice, BigDecimal sellingPrice, BigDecimal offerPrice) {
        if (buyingPrice != null && buyingPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Buying price cannot be negative.");
        }
        if (sellingPrice != null && sellingPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Selling price must be greater than 0.");
        }
        if (offerPrice != null && sellingPrice != null) {
            if (offerPrice.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Offer price cannot be negative.");
            }
            if (offerPrice.compareTo(sellingPrice) > 0) {
                throw new IllegalArgumentException("Offer price (" + offerPrice + ") cannot be higher than selling price (" + sellingPrice + ").");
            }
        }
    }

    /**
     * Makes the gallery exactly match {@code urls}, in that order. Existing images are reused
     * (same row and ID), new URLs are added, and images no longer listed are removed — their
     * files are deleted from disk once the transaction commits.
     */
    private void syncImagesFromUrls(Product product, List<String> urls, String primaryUrl) {
        List<String> wanted = urls.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();
        if (wanted.size() < 2 || wanted.size() > 5) {
            throw new BadRequestException("A product needs 2 to 5 images. It currently has " + wanted.size() + ".");
        }

        Map<String, ProductImage> existingByUrl = product.getImages().stream()
                .collect(Collectors.toMap(ProductImage::getImageUrl, Function.identity(), (a, b) -> a));
        List<String> removedFiles = existingByUrl.keySet().stream()
                .filter(url -> !wanted.contains(url))
                .toList();

        String cover = wanted.contains(primaryUrl) ? primaryUrl : wanted.get(0);

        // Rebuild the collection; orphanRemoval deletes rows that aren't re-added
        product.getImages().clear();
        for (int i = 0; i < wanted.size(); i++) {
            String url = wanted.get(i);
            ProductImage image = existingByUrl.getOrDefault(url, ProductImage.builder()
                    .imageUrl(url)
                    .altText(product.getDisplayName() + " image " + (i + 1))
                    .build());
            image.setDisplayOrder(i);
            image.setIsPrimary(url.equals(cover));
            product.addImage(image);
        }

        deleteFilesIfUnused(removedFiles);
    }

    private void handleImageUpdates(Product product, List<Long> keepImageIds, List<MultipartFile> newFiles) {
        List<ProductImage> currentImages = new ArrayList<>(product.getImages());
        List<ProductImage> retainedImages = new ArrayList<>();
        List<String> removedFiles = new ArrayList<>();

        if (keepImageIds != null) {
            for (ProductImage img : currentImages) {
                if (keepImageIds.contains(img.getId())) {
                    retainedImages.add(img);
                } else {
                    removedFiles.add(img.getImageUrl());
                }
            }
        } else {
            retainedImages.addAll(currentImages);
        }

        List<MultipartFile> validNewFiles = (newFiles != null) ? newFiles.stream().filter(f -> f != null && !f.isEmpty()).toList() : List.of();
        int totalProjected = retainedImages.size() + validNewFiles.size();

        if (totalProjected < 2 || totalProjected > 5) {
            throw new IllegalArgumentException("Product must have between 2 and 5 images in total. Projected count: " + totalProjected);
        }

        // Strategy C: Remove unkept images from product and host disk
        product.getImages().clear();
        for (ProductImage retained : retainedImages) {
            product.addImage(retained);
        }
        deleteFilesIfUnused(removedFiles);

        // Upload and append new images
        for (MultipartFile file : validNewFiles) {
            String storedName = fileStorageService.storeFile(file);
            ProductImage pImage = ProductImage.builder()
                    .imageUrl(storedName)
                    .isPrimary(product.getImages().isEmpty())
                    .displayOrder(product.getImages().size())
                    .altText(product.getDisplayName())
                    .build();
            product.addImage(pImage);
        }

        // Ensure exactly one primary image
        boolean hasPrimary = product.getImages().stream().anyMatch(ProductImage::getIsPrimary);
        if (!hasPrimary && !product.getImages().isEmpty()) {
            product.getImages().get(0).setIsPrimary(true);
        }
    }

    public ProductResponse mapToPublicResponse(Product product) {
        List<ProductImageDto> imageDtos = product.getImages().stream()
                .map(this::mapToImageDto)
                .collect(Collectors.toList());

        String primaryImg = imageDtos.stream()
                .filter(ProductImageDto::getIsPrimary)
                .map(ProductImageDto::getImageUrl)
                .findFirst()
                .orElse(imageDtos.isEmpty() ? null : imageDtos.get(0).getImageUrl());

        Integer discount = null;
        if (product.getOfferPrice() != null && product.getSellingPrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = product.getSellingPrice().subtract(product.getOfferPrice());
            discount = diff.multiply(BigDecimal.valueOf(100))
                    .divide(product.getSellingPrice(), 0, RoundingMode.HALF_UP)
                    .intValue();
        }

        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .sizeLabel(product.getSizeLabel())
                .displayName(product.getDisplayName())
                .variantGroup(product.getVariantGroup())
                .slug(product.getSlug())
                .description(product.getDescription())
                .details(product.getDetails())
                .ingredients(product.getIngredients())
                .sellingPrice(product.getSellingPrice())
                .offerPrice(product.getOfferPrice())
                .discountPercentage(discount)
                .stockQuantity(product.getStockQuantity())
                .inStock(product.getStockQuantity() != null && product.getStockQuantity() > 0)
                .isTrending(product.getIsTrending())
                .isActive(product.getIsActive())
                .averageRating(product.getAverageRating())
                .reviewCount(product.getReviewCount())
                .category(categoryService.mapToResponse(product.getCategory()))
                .primaryImageUrl(primaryImg)
                .images(imageDtos)
                .createdAt(product.getCreatedAt())
                .build();
    }

    public AdminProductResponse mapToAdminResponse(Product product) {
        ProductResponse pub = mapToPublicResponse(product);

        // Calculate Gross Profit & Margin
        BigDecimal effectiveSelling = product.getOfferPrice() != null ? product.getOfferPrice() : product.getSellingPrice();
        BigDecimal grossProfit = effectiveSelling.subtract(product.getBuyingPrice());
        BigDecimal marginPct = BigDecimal.ZERO;
        if (effectiveSelling.compareTo(BigDecimal.ZERO) > 0) {
            marginPct = grossProfit.multiply(BigDecimal.valueOf(100))
                    .divide(effectiveSelling, 2, RoundingMode.HALF_UP);
        }

        return AdminProductResponse.builder()
                .id(pub.getId())
                .sku(pub.getSku())
                .name(pub.getName())
                .sizeLabel(pub.getSizeLabel())
                .displayName(pub.getDisplayName())
                .variantGroup(pub.getVariantGroup())
                .slug(pub.getSlug())
                .description(pub.getDescription())
                .details(pub.getDetails())
                .ingredients(pub.getIngredients())
                .buyingPrice(product.getBuyingPrice())
                .sellingPrice(product.getSellingPrice())
                .offerPrice(product.getOfferPrice())
                .discountPercentage(pub.getDiscountPercentage())
                .grossProfit(grossProfit)
                .marginPercentage(marginPct)
                .stockQuantity(product.getStockQuantity())
                .inStock(pub.getInStock())
                .isTrending(product.getIsTrending())
                .isActive(product.getIsActive())
                .averageRating(product.getAverageRating())
                .reviewCount(product.getReviewCount())
                .category(pub.getCategory())
                .primaryImageUrl(pub.getPrimaryImageUrl())
                .images(pub.getImages())
                .version(product.getVersion())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private ProductImageDto mapToImageDto(ProductImage img) {
        return ProductImageDto.builder()
                .id(img.getId())
                .imageUrl(img.getImageUrl())
                .isPrimary(img.getIsPrimary())
                .displayOrder(img.getDisplayOrder())
                .altText(img.getAltText())
                .build();
    }
}

