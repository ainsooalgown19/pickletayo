package com.tarapickle.facility.infrastructure;
import com.tarapickle.facility.domain.CourtRateRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CourtRateRuleRepository extends JpaRepository<CourtRateRule,UUID> { List<CourtRateRule> findAllByCourtIdAndActiveTrueOrderByPriorityDesc(UUID courtId); }
