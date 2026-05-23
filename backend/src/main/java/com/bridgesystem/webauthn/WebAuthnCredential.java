package com.bridgesystem.webauthn;

import com.bridgesystem.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "webauthn_credential")
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "credential_id", nullable = false, unique = true)
    private byte[] credentialId;

    @Column(name = "public_key_cose", nullable = false)
    private byte[] publicKeyCose;

    @Column(name = "signature_count", nullable = false)
    private long signatureCount;

    @Column(name = "aaguid")
    private byte[] aaguid;

    @Column(name = "nickname", length = 128)
    private String nickname;

    @Column(name = "transports", length = 255)
    private String transports;

    @Column(name = "is_backup_eligible", nullable = false)
    private boolean backupEligible;

    @Column(name = "is_backed_up", nullable = false)
    private boolean backedUp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "last_used_at")
    private OffsetDateTime lastUsedAt;

    protected WebAuthnCredential() {
    }

    public WebAuthnCredential(AppUser user,
                              byte[] credentialId,
                              byte[] publicKeyCose,
                              long signatureCount,
                              byte[] aaguid,
                              String nickname,
                              String transports,
                              boolean backupEligible,
                              boolean backedUp) {
        this.user = user;
        this.credentialId = credentialId;
        this.publicKeyCose = publicKeyCose;
        this.signatureCount = signatureCount;
        this.aaguid = aaguid;
        this.nickname = nickname;
        this.transports = transports;
        this.backupEligible = backupEligible;
        this.backedUp = backedUp;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public byte[] getCredentialId() {
        return credentialId;
    }

    public byte[] getPublicKeyCose() {
        return publicKeyCose;
    }

    public long getSignatureCount() {
        return signatureCount;
    }

    public void setSignatureCount(long signatureCount) {
        this.signatureCount = signatureCount;
    }

    public byte[] getAaguid() {
        return aaguid;
    }

    public String getNickname() {
        return nickname;
    }

    public String getTransports() {
        return transports;
    }

    public boolean isBackupEligible() {
        return backupEligible;
    }

    public boolean isBackedUp() {
        return backedUp;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getLastUsedAt() {
        return lastUsedAt;
    }

    public void markUsed() {
        this.lastUsedAt = OffsetDateTime.now();
    }
}
