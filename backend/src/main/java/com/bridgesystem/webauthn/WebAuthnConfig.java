package com.bridgesystem.webauthn;

import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashSet;

@Configuration
public class WebAuthnConfig {

    @Bean
    public RelyingParty relyingParty(WebAuthnProperties props,
                                     JpaCredentialRepository credentialRepository) {
        RelyingPartyIdentity identity = RelyingPartyIdentity.builder()
                .id(props.rpId())
                .name(props.rpName())
                .build();

        return RelyingParty.builder()
                .identity(identity)
                .credentialRepository(credentialRepository)
                .origins(new HashSet<>(props.origins()))
                .allowOriginPort(true)
                .build();
    }
}
