package com.chargegrid.backend.api;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class BookingPricing {
    private BookingPricing() {}

    public static BigDecimal estimateCost(BigDecimal energyKwh, BigDecimal pricePerKwhInr) {
        if (energyKwh == null || pricePerKwhInr == null) {
            throw new IllegalArgumentException("Energy and price are required");
        }
        if (energyKwh.signum() < 0 || pricePerKwhInr.signum() < 0) {
            throw new IllegalArgumentException("Energy and price cannot be negative");
        }
        return energyKwh.multiply(pricePerKwhInr).setScale(2, RoundingMode.HALF_UP);
    }
}
