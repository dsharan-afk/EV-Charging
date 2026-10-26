package com.chargegrid.backend;

import com.chargegrid.backend.security.FirstAdminProvisioner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class AdminProvisioningRunner implements ApplicationRunner {
    public static final String PROVISION_ARGUMENT = "--provision-first-admin";

    private final FirstAdminProvisioner provisioner;
    private final Environment environment;

    public AdminProvisioningRunner(FirstAdminProvisioner provisioner, Environment environment) {
        this.provisioner = provisioner;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!ProvisioningArguments.isRequested(args.getSourceArgs())) {
            return;
        }
        if (!"production".equalsIgnoreCase(environment.getProperty("APP_ENV", "development"))) {
            throw new IllegalStateException("First-admin provisioning is allowed only in production mode");
        }

        String email = environment.getProperty("FIRST_ADMIN_EMAIL");
        String password = environment.getProperty("FIRST_ADMIN_PASSWORD");
        String name = environment.getProperty("FIRST_ADMIN_NAME", "ChargeGrid Administrator");
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalStateException("Set FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD for this one-time command");
        }

        provisioner.provision(email, password, name);
        System.out.println("First administrator provisioned successfully.");
    }
}
