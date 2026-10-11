package com.tarapickle.identity.domain.model; import jakarta.persistence.*; import lombok.*; import java.util.*;
@Entity @Table(name="roles") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED) public class Role { @Id private UUID id; @Column(nullable=false,unique=true) private String code; private String description; }
