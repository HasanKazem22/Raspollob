package com.raspollob.server.repository;

import com.raspollob.server.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlug(String slug);

    boolean existsByName(String name);

    boolean existsBySlug(String slug);

    List<Category> findAllByIsActiveTrueOrderByDisplayOrderAsc();

    List<Category> findAllByIsActiveTrueAndShowInNavbarTrueOrderByDisplayOrderAscNameAsc();

    List<Category> findAllByIsActiveTrueAndShowInHomeTrueOrderByDisplayOrderAscNameAsc();

    List<Category> findAllByOrderByDisplayOrderAscNameAsc();

    /** Admin list: newest first */
    List<Category> findAllByOrderByCreatedAtDescIdDesc();
}

