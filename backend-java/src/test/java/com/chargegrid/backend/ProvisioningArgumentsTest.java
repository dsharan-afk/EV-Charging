package com.chargegrid.backend;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;

class ProvisioningArgumentsTest {
    @Test
    void recognizesBareProvisioningFlagAndSelectsNonWebMode() {
        String[] args = {AdminProvisioningRunner.PROVISION_ARGUMENT};

        assertTrue(ProvisioningArguments.isRequested(args));
        assertTrue(ChargegridBackendApplication.createApplication(args).getWebApplicationType()
            == WebApplicationType.NONE);
    }

    @Test
    void rejectsValuedProvisioningFlagBeforeSpringCanStart() {
        String[] args = {"--provision-first-admin=true"};

        assertThrows(IllegalArgumentException.class, () -> ProvisioningArguments.isRequested(args));
        assertThrows(IllegalArgumentException.class, () -> ChargegridBackendApplication.createApplication(args));
    }

    @Test
    void normalStartupUsesWebModeAndDoesNotRequestProvisioning() {
        String[] args = {"--server.port=8080"};

        assertFalse(ProvisioningArguments.isRequested(args));
        assertTrue(ChargegridBackendApplication.createApplication(args).getWebApplicationType()
            == WebApplicationType.SERVLET);
    }

    @Test
    void rejectsDuplicateProvisioningFlag() {
        assertThrows(IllegalArgumentException.class,
            () -> ChargegridBackendApplication.createApplication(new String[] {
                AdminProvisioningRunner.PROVISION_ARGUMENT,
                AdminProvisioningRunner.PROVISION_ARGUMENT
            }));
    }
}
