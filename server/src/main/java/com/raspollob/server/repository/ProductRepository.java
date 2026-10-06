package com.raspollob.server.repository;

import com.raspollob.server.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlug(String slug);

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    /** All sizes of one item, including inactive ones (callers filter and sort). */
    List<Product> findByVariantGroup(String variantGroup);

    /** Which of these image files are still used by some product (sizes may share photos). */
    @Query("SELECT DISTINCT i.imageUrl FROM ProductImage i WHERE i.imageUrl IN :urls")
    List<String> findImageUrlsInUse(@Param("urls") Collection<String> urls);

    /**
     * Home Page Trending Section: Top active products flagged as trending.
     */
    @Query("SELECT p FROM Product p WHERE p.isTrending = true AND p.isActive = true ORDER BY p.updatedAt DESC")
    List<Product> findTrendingProducts(Pageable pageable);

    /*
     * `pattern` is a ready-made lower-case LIKE pattern (e.g. "%honey%") or null for "no search".
     * It is compared directly with LIKE so Hibernate can infer its type from the column;
     * wrapping a nullable parameter in LOWER()/CONCAT() makes PostgreSQL see a null as
     * bytea ("function lower(bytea) does not exist"). Build it with ProductService#toSearchPattern.
     */
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:pattern IS NULL OR LOWER(p.name) LIKE :pattern ESCAPE '\\' OR LOWER(p.sizeLabel) LIKE :pattern ESCAPE '\\' OR LOWER(p.description) LIKE :pattern ESCAPE '\\')")
    Page<Product> findPublicProducts(@Param("categoryId") Long categoryId,
                                     @Param("pattern") String pattern,
                                     Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:pattern IS NULL OR LOWER(p.name) LIKE :pattern ESCAPE '\\' OR LOWER(p.sizeLabel) LIKE :pattern ESCAPE '\\' OR LOWER(p.sku) LIKE :pattern ESCAPE '\\')")
    Page<Product> findAdminProducts(@Param("categoryId") Long categoryId,
                                    @Param("pattern") String pattern,
                                    Pageable pageable);
}

