package com.chargegrid.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.core.env.MapPropertySource;

import java.util.Map;

@SpringBootApplication
public class ChargegridBackendApplication {
    public static void main(String[] args) {
        createApplication(args).run(args);
    }

    static SpringApplication createApplication(String[] args) {
        SpringApplication application = new SpringApplication(ChargegridBackendApplication.class);
        if (ProvisioningArguments.isRequested(args)) {
            application.setWebApplicationType(WebApplicationType.NONE);
            application.addListeners((ApplicationEnvironmentPreparedEvent event) ->
                event.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("first-admin-provisioning-web-mode",
                        Map.of("spring.main.web-application-type", "none"))));
        }
        return application;
    }
}
