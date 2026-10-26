package com.chargegrid.backend.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class BookingPricingTest {
    private static final BigDecimal RATE = new BigDecimal("18.00");

    @Test
    void calculatesTwentyKwhAtEighteenRupeesPerKwh() {
        assertEquals(new BigDecimal("360.00"),
            BookingPricing.estimateCost(new BigDecimal("20"), RATE));
    }

    @Test
    void calculatesOneKwhAtEighteenRupeesPerKwh() {
        assertEquals(new BigDecimal("18.00"),
            BookingPricing.estimateCost(BigDecimal.ONE, RATE));
    }

    @Test
    void zeroEnergyHasZeroCost() {
        assertEquals(new BigDecimal("0.00"),
            BookingPricing.estimateCost(BigDecimal.ZERO, RATE));
    }

    @Test
    void roundsDecimalEnergyToTwoCurrencyPlaces() {
        assertEquals(new BigDecimal("22.21"),
            BookingPricing.estimateCost(new BigDecimal("1.234"), RATE));
        assertEquals(new BigDecimal("0.01"),
            BookingPricing.estimateCost(new BigDecimal("0.005"), BigDecimal.ONE));
    }

    @Test
    void rejectsNegativeEnergyAndPricing() {
        assertThrows(IllegalArgumentException.class,
            () -> BookingPricing.estimateCost(new BigDecimal("-1"), RATE));
        assertThrows(IllegalArgumentException.class,
            () -> BookingPricing.estimateCost(BigDecimal.ONE, new BigDecimal("-0.01")));
    }
}
