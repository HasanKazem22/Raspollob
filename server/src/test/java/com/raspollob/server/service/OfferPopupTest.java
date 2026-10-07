package com.raspollob.server.service;

import com.raspollob.server.entity.StoreConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class OfferPopupTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 5, 12, 0);

    @Test
    void showsOnlyWhenEnabledWithAnImageAndInsideItsDates() {
        StoreConfig c = new StoreConfig();
        c.setOfferImage("/uploads/eid.webp");
        assertThat(StoreConfigService.isOfferActive(c, NOW)).isFalse(); // switched off

        c.setOfferEnabled(true);
        assertThat(StoreConfigService.isOfferActive(c, NOW)).isTrue(); // no dates = always

        c.setOfferStartsAt(NOW.plusDays(1));
        assertThat(StoreConfigService.isOfferActive(c, NOW)).isFalse(); // not started yet

        c.setOfferStartsAt(NOW.minusDays(1));
        c.setOfferEndsAt(NOW);
        assertThat(StoreConfigService.isOfferActive(c, NOW)).isFalse(); // ended exactly now

        c.setOfferEndsAt(NOW.plusMinutes(1));
        assertThat(StoreConfigService.isOfferActive(c, NOW)).isTrue();

        c.setOfferImage(null);
        assertThat(StoreConfigService.isOfferActive(c, NOW)).isFalse(); // nothing to show
    }

    @ParameterizedTest
    @ValueSource(strings = {"/category/natural-honey", "/product/12", "/search?q=honey", "https://facebook.com/raspollob"})
    void acceptsSiteAndHttpsLinks(String link) {
        assertThat(StoreConfigService.isSafeLink(link)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"javascript:alert(1)", "//evil.example", "/\\evil.example", "http://plain.example", "https://", "data:text/html,x"})
    void rejectsUnsafeLinks(String link) {
        assertThat(StoreConfigService.isSafeLink(link)).isFalse();
    }
}
