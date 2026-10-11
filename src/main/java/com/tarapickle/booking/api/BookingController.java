package com.tarapickle.booking.api;
import com.tarapickle.booking.api.BookingDtos.*; import com.tarapickle.booking.application.BookingService;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.data.domain.*; import org.springframework.http.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal; import org.springframework.security.oauth2.jwt.Jwt; import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/v1/bookings") @RequiredArgsConstructor
public class BookingController {
 private final BookingService service;
 @PostMapping("/holds") @ResponseStatus(HttpStatus.CREATED) public BookingResponse hold(@AuthenticationPrincipal Jwt jwt,@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody CreateHoldRequest request){return service.hold(uid(jwt),key,request);}
 @PostMapping("/{bookingId}/submit") public BookingResponse submit(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID bookingId){return service.submit(uid(jwt),bookingId);}
 @GetMapping public Page<BookingResponse> list(@AuthenticationPrincipal Jwt jwt,@PageableDefault(size=20,sort="createdAt",direction=Sort.Direction.DESC) Pageable pageable){return service.list(uid(jwt),pageable);}
 @GetMapping("/{bookingId}") public BookingResponse get(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID bookingId){return service.get(uid(jwt),bookingId);}
 @DeleteMapping("/{bookingId}") public BookingResponse cancel(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID bookingId){return service.cancel(uid(jwt),bookingId);}
 private UUID uid(Jwt jwt){return UUID.fromString(jwt.getSubject());}
}
