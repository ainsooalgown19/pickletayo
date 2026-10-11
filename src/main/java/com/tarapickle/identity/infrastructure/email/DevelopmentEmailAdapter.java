package com.tarapickle.identity.infrastructure.email;
import com.tarapickle.identity.application.port.EmailPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
@Component @Profile("local") @Slf4j public class DevelopmentEmailAdapter implements EmailPort {
 public void sendVerification(String email,String token){log.info("LOCAL verification recipient={} token={}",email,token);}
 public void sendPasswordReset(String email,String token){log.info("LOCAL password-reset recipient={} token={}",email,token);}
}
