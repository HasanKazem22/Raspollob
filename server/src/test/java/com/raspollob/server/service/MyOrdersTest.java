package com.raspollob.server.service;

import com.raspollob.server.entity.Order;
import com.raspollob.server.entity.User;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.repository.OrderRepository;
import com.raspollob.server.repository.ProductRepository;
import com.raspollob.server.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Customers can open their own orders without a phone number, and nobody else's. */
class MyOrdersTest {

    private final OrderRepository orders = mock(OrderRepository.class);
    private final OrderService service = new OrderService(orders, mock(ProductRepository.class), mock(UserRepository.class),
            mock(PromoCodeService.class), mock(StoreConfigService.class));

    @Test
    void someoneElsesOrderIsNotFound() {
        when(orders.findByOrderNumber("RP261007-AB3K")).thenReturn(Optional.of(orderOf(user(1))));

        assertThatThrownBy(() -> service.myOrder(2L, "RP261007-AB3K")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void guestOrdersAreNotInAnyAccount() {
        when(orders.findByOrderNumber("RP261007-ZZ99")).thenReturn(Optional.of(orderOf(null)));

        assertThatThrownBy(() -> service.myOrder(1L, "rp261007-zz99")).isInstanceOf(ResourceNotFoundException.class);
    }

    private static User user(long id) {
        User u = User.builder().username("u" + id).build();
        u.setId(id);
        return u;
    }

    private static Order orderOf(User owner) {
        Order o = new Order();
        o.setUser(owner);
        return o;
    }
}
