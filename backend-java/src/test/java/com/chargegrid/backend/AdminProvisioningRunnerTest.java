
 package com.chargegrid.backend;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.chargegrid.backend.security.FirstAdminProvisioner;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.core.env.Environment;

class AdminProvisioningRunnerTest {
    @Test
    void doesNotProvisionOnOrdinaryApplicationStartup() {
        FirstAdminProvisioner provisioner = mock(FirstAdminProvisioner.class);
        Environment environment = mock(Environment.class);
        AdminProvisioningRunner runner = new AdminProvisioningRunner(provisioner, environment);

        runner.run(new DefaultApplicationArguments(new String[0]));

        verify(provisioner, never()).provision(org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void provisionsOnlyWhenExplicitProductionCommandIsPresent() {
        FirstAdminProvisioner provisioner = mock(FirstAdminProvisioner.class);
        Environment environment = mock(Environment.class);
        when(environment.getProperty("APP_ENV", "development")).thenReturn("production");
        when(environment.getProperty("FIRST_ADMIN_EMAIL")).thenReturn("admin@example.com");
        when(environment.getProperty("FIRST_ADMIN_PASSWORD")).thenReturn("test-password-not-a-secret");
        when(environment.getProperty("FIRST_ADMIN_NAME", "ChargeGrid Administrator"))
            .thenReturn("ChargeGrid Administrator");
        AdminProvisioningRunner runner = new AdminProvisioningRunner(provisioner, environment);

        runner.run(new DefaultApplicationArguments(new String[] {AdminProvisioningRunner.PROVISION_ARGUMENT}));

        verify(provisioner).provision("admin@example.com", "test-password-not-a-secret",
            "ChargeGrid Administrator");
    }

    @Test
    void refusesProvisioningWhenProductionModeIsMissing() {
        FirstAdminProvisioner provisioner = mock(FirstAdminProvisioner.class);
        Environment environment = mock(Environment.class);
        when(environment.getProperty("APP_ENV", "development")).thenReturn("development");
        AdminProvisioningRunner runner = new AdminProvisioningRunner(provisioner, environment);

        assertThrows(IllegalStateException.class,
            () -> runner.run(new DefaultApplicationArguments(
                new String[] {AdminProvisioningRunner.PROVISION_ARGUMENT})));
        verify(provisioner, never()).provision(org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void normalStartupDoesNotProvisionEvenInProduction() {
        FirstAdminProvisioner provisioner = mock(FirstAdminProvisioner.class);
        Environment environment = mock(Environment.class);
        when(environment.getProperty("APP_ENV", "development")).thenReturn("production");
        AdminProvisioningRunner runner = new AdminProvisioningRunner(provisioner, environment);

        runner.run(new DefaultApplicationArguments(new String[0]));

        verify(provisioner, never()).provision(org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }
}
