package com.raspollob.server.repository;

import com.raspollob.server.entity.Order;
import com.raspollob.server.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /** New orders waiting for staff (admin sidebar badge). */
    long countByStatus(OrderStatus status);

    Optional<Order> findByOrderNumber(String orderNumber);

    /** A customer's own orders (placed while signed in). */
    Page<Order> findByUser_Id(Long userId, Pageable pageable);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    boolean existsByOrderNumber(String orderNumber);

    boolean existsByPromoCode_Id(Long promoCodeId);

    /** Same transaction ID already used on an order that wasn't cancelled. */
    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM CustomerOrder o WHERE LOWER(o.transactionId) = LOWER(:transactionId) " +
           "AND o.status <> com.raspollob.server.entity.enums.OrderStatus.CANCELLED")
    boolean existsActiveByTransactionId(@Param("transactionId") String transactionId);

    /** Times a customer (by account or phone) used a promo on orders that weren't cancelled. */
    // LEFT JOIN so guest orders (no user) are still matched by phone
    @Query("SELECT COUNT(o) FROM CustomerOrder o LEFT JOIN o.user u WHERE o.promoCode.id = :promoId " +
           "AND o.status <> com.raspollob.server.entity.enums.OrderStatus.CANCELLED " +
           "AND ((:userId IS NOT NULL AND u.id = :userId) OR o.shippingAddress.phone = :phone)")
    long countPromoUsesByCustomer(@Param("promoId") Long promoId,
                                  @Param("userId") Long userId,
                                  @Param("phone") String phone);

    /**
     * Admin list. `pattern` is a lower-case LIKE pattern or null (see ProductService#toSearchPattern
     * for why it's compared directly with LIKE).
     */
    @Query("SELECT o FROM CustomerOrder o WHERE (:status IS NULL OR o.status = :status) AND " +
           "(:pattern IS NULL OR LOWER(o.orderNumber) LIKE :pattern ESCAPE '\\' " +
           "OR LOWER(o.shippingAddress.fullName) LIKE :pattern ESCAPE '\\' " +
           "OR o.shippingAddress.phone LIKE :pattern ESCAPE '\\')")
    Page<Order> searchAdmin(@Param("status") OrderStatus status,
                            @Param("pattern") String pattern,
                            Pageable pageable);
}
