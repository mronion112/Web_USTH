package vn.lunara.backend;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

class SepaySignatureTest {
    private static final String SECRET="unit-test-sepay-secret";
    private final SepayService service=new SepayService(null,null,null);

    SepaySignatureTest() { ReflectionTestUtils.setField(service,"secret",SECRET); }

    private String signature(String timestamp,byte[] body) throws Exception {
        Mac mac=Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
        mac.update((timestamp+".").getBytes(StandardCharsets.UTF_8));
        return "sha256="+HexFormat.of().formatHex(mac.doFinal(body));
    }

    @Test void acceptsExactSignedBytes() throws Exception {
        byte[] body="{\"id\":42,\"transferAmount\":450000}".getBytes(StandardCharsets.UTF_8);
        String timestamp=String.valueOf(Instant.now().getEpochSecond());
        assertDoesNotThrow(() -> service.verify(body,timestamp,signature(timestamp,body)));
    }

    @Test void rejectsBodyTampering() throws Exception {
        String timestamp=String.valueOf(Instant.now().getEpochSecond());
        byte[] original="{\"transferAmount\":450000}".getBytes(StandardCharsets.UTF_8);
        byte[] tampered="{\"transferAmount\":1}".getBytes(StandardCharsets.UTF_8);
        assertThrows(ResponseStatusException.class,() -> service.verify(tampered,timestamp,signature(timestamp,original)));
    }

    @Test void rejectsReplayedOldTimestamp() throws Exception {
        byte[] body="{}".getBytes(StandardCharsets.UTF_8);
        String old=String.valueOf(Instant.now().minusSeconds(600).getEpochSecond());
        assertThrows(ResponseStatusException.class,() -> service.verify(body,old,signature(old,body)));
    }
}
