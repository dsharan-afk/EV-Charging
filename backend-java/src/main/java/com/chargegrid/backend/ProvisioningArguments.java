package com.chargegrid.backend;

import java.util.Arrays;

public final class ProvisioningArguments {
    private ProvisioningArguments() {}

    public static boolean isRequested(String[] args) {
        boolean requested = false;
        for (String arg : args) {
            if (arg != null && arg.startsWith(AdminProvisioningRunner.PROVISION_ARGUMENT + "=")) {
                throw new IllegalArgumentException(
                    "Use --provision-first-admin without a value; valued variants are not supported");
            }
            if (AdminProvisioningRunner.PROVISION_ARGUMENT.equals(arg)) {
                if (requested) {
                    throw new IllegalArgumentException("--provision-first-admin may only be specified once");
                }
                requested = true;
            }
        }
        return requested;
    }
}
