package com.tarapickle.facility.domain;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

class FacilityTest {
    @Test void newFacilityStartsAsDraftAndCanBeActivated() {
        Instant now=Instant.parse("2026-09-27T00:00:00Z");
        Facility facility=new Facility(UUID.randomUUID(),UUID.randomUUID(),"PickleTayo Center","MAIN",null,null,null,"Asia/Manila",now);
        assertThat(facility.getStatus()).isEqualTo(FacilityStatus.DRAFT);
        facility.changeStatus(FacilityStatus.ACTIVE,now.plusSeconds(60));
        assertThat(facility.getStatus()).isEqualTo(FacilityStatus.ACTIVE);
    }

    @Test void closedFacilityCannotBeReopened() {
        Instant now=Instant.parse("2026-09-27T00:00:00Z");
        Facility facility=new Facility(UUID.randomUUID(),UUID.randomUUID(),"PickleTayo Center","MAIN",null,null,null,"Asia/Manila",now);
        facility.changeStatus(FacilityStatus.CLOSED,now.plusSeconds(60));
        assertThatThrownBy(()->facility.changeStatus(FacilityStatus.ACTIVE,now.plusSeconds(120))).isInstanceOf(IllegalStateException.class);
    }
}
