package com.tarapickle.identity.infrastructure.bootstrap;

import com.tarapickle.identity.domain.model.AccountStatus;
import com.tarapickle.identity.domain.model.ConsentRecord;
import com.tarapickle.identity.domain.model.User;
import com.tarapickle.identity.domain.model.UserCredential;
import com.tarapickle.identity.domain.repository.ConsentRepository;
import com.tarapickle.identity.domain.repository.CredentialRepository;
import com.tarapickle.identity.domain.repository.RoleRepository;
import com.tarapickle.identity.domain.repository.UserRepository;
import com.tarapickle.identity.domain.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Component
@Profile("local")
@ConditionalOnProperty(prefix = "pickletayo.bootstrap-admin", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class LocalSystemAdminBootstrap {
    private final UserRepository users;
    private final CredentialRepository credentials;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;
    private final ConsentRepository consents;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Value("${pickletayo.bootstrap-admin.email}")
    private String configuredEmail;

    @Value("${pickletayo.bootstrap-admin.password}")
    private String configuredPassword;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void createOrUpdateLocalAdministrator() {
        String email = configuredEmail.strip().toLowerCase(Locale.ROOT);
        if (email.isBlank() || configuredPassword.length() < 12) {
            throw new IllegalStateException("Local administrator email and a 12+ character password are required.");
        }

        Instant now = clock.instant();
        User administrator = users.findByEmailIgnoreCase(email).orElseGet(() -> createUser(email, now));

        if (administrator.getStatus() == AccountStatus.PENDING_VERIFICATION) {
            administrator.verifyEmail(now);
        }
        if (administrator.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException("The configured local administrator account is not active.");
        }

        if (credentials.findById(administrator.getId()).isEmpty()) {
            credentials.save(new UserCredential(administrator.getId(), passwordEncoder.encode(configuredPassword), now));
        }

        if (!userRoles.roles(administrator.getId()).contains("PLATFORM_ADMIN")) {
            var administratorRole = roles.findByCode("PLATFORM_ADMIN")
                    .orElseThrow(() -> new IllegalStateException("PLATFORM_ADMIN role has not been seeded."));
            userRoles.assign(administrator.getId(), administratorRole.getId());
        }

        log.info("Local PickleTayo system administrator is ready: {}", email);
    }

    private User createUser(String email, Instant now) {
        User user = new User(UUID.randomUUID(), email, "PickleTayo", "Administrator", now);
        user.verifyEmail(now);
        User saved = users.save(user);
        consents.saveAll(List.of(
                new ConsentRecord(saved.getId(), "TERMS_OF_SERVICE", "2026-08-21", now),
                new ConsentRecord(saved.getId(), "PRIVACY_POLICY", "2026-08-21", now)
        ));
        return saved;
    }
}
