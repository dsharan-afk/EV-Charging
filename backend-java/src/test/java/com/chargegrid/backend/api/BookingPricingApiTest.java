package com.chargegrid.backend.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {"APP_ENV=development", "JWT_SECRET=test-only-api-signing-key"})
@AutoConfigureMockMvc
class BookingPricingApiTest {
    private static final Path DATABASE_PATH = createTemporaryDatabasePath();

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("chargegrid.sqlite.path", () -> DATABASE_PATH.toString());
    }

    @Test
    void bookingEndpointReturnsEnergyAndPriceInExpectedUnits() throws Exception {
        mockMvc.perform(get("/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"));
        mockMvc.perform(get("/api/v1/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"));
        mockMvc.perform(get("/ready"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"));

        mockMvc.perform(get("/api/v1/stations/station-demo-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.price_per_kwh").value(18.0));
        mockMvc.perform(get("/api/v1/stations/station-demo-2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.price_per_kwh").value(16.0));
        mockMvc.perform(get("/api/v1/stations/station-demo-3"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.price_per_kwh").value(14.0));

        MvcResult registration = mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "pricing-test-" + java.util.UUID.randomUUID() + "@example.com",
                    "password", "test-password-123",
                    "name", "Pricing Test"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
            .andReturn();
        JsonNode auth = objectMapper.readTree(registration.getResponse().getContentAsString());
        String token = auth.path("token").asText();
        String start = LocalDateTime.now().plusHours(2).withNano(0).toString();
        String end = LocalDateTime.parse(start).plusMinutes(45).toString();

        assertBookingPrice(token, "station-demo-1", start, end, 360.00);
        assertBookingPrice(token, "station-demo-3", start, end, 280.00);
        assertBookingPrice(token, "station-demo-2", start, end, 320.00);

        assertInvalidEnergy(token, "station-demo-1", start, end, Map.of("estimatedKwh", BigDecimal.ZERO));
        assertInvalidEnergy(token, "station-demo-1", start, end, Map.of("estimatedKwh", new BigDecimal("-1")));
        assertInvalidEnergy(token, "station-demo-1", start, end, Map.of("estimatedKwh", new BigDecimal("501")));
        assertInvalidEnergy(token, "station-demo-1", start, end, Map.of("estimatedKwh", new BigDecimal("1.1234567")));
        assertInvalidEnergy(token, "station-demo-1", start, end, Map.of());

        mockMvc.perform(get("/api/v1/wallet")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.balance").value(0));
    }

    @Test
    void adminRegistrationIsNotExposedAsPublicHttpRoute() throws Exception {
        mockMvc.perform(post("/api/v1/admin/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/auth/admin/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isNotFound());
    }

    private void assertBookingPrice(String token, String stationId, String start, String end, double expectedCost)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/bookings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "stationId", stationId,
                    "startTime", start,
                    "endTime", end,
                    "estimatedKwh", 20))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.estimated_kwh").value(20.0))
            .andExpect(jsonPath("$.estimated_cost").value(expectedCost))
            .andReturn();

        String bookingId = objectMapper.readTree(result.getResponse().getContentAsString()).path("id").asText();
        JsonNode savedBookings = objectMapper.readTree(mockMvc.perform(get("/api/v1/bookings")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString());
        boolean persisted = false;
        for (JsonNode booking : savedBookings) {
            if (booking.path("id").asText().equals(bookingId)
                    && booking.path("estimated_kwh").decimalValue().compareTo(new BigDecimal("20")) == 0
                    && booking.path("estimated_cost").decimalValue().compareTo(BigDecimal.valueOf(expectedCost)) == 0) {
                persisted = true;
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertTrue(persisted, "Booking energy and cost should be persisted");
    }

    private void assertInvalidEnergy(String token, String stationId, String start, String end, Map<String, Object> energy)
            throws Exception {
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("stationId", stationId);
        payload.put("startTime", start);
        payload.put("endTime", end);
        payload.putAll(energy);
        mockMvc.perform(post("/api/v1/bookings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isBadRequest());
    }

    private static Path createTemporaryDatabasePath() {
        try {
            return Files.createTempDirectory("chargegrid-pricing-api-test-").resolve("test.db");
        } catch (Exception exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

}
