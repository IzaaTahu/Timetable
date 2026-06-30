<?php

class TimetableModel {

    // ── Fetch list schedule bulanan ──────────────────────────
    public function getSchedules(int $month, int $year): array {
        $url = "https://jkt48.com/api/v1/schedules?lang=id&month={$month}&year={$year}";

        $result = $this->curl($url, [
            'Referer: https://jkt48.com/',
        ]);

        if (!$result['ok']) return ['items' => [], 'error' => $result['error']];

        $json = json_decode($result['body'], true);
        if (empty($json['status']) || empty($json['data'])) {
            return ['items' => [], 'error' => null];
        }

        // Filter hanya EXCLUSIVE yang judulnya M&G atau 2-shot
        $items = array_values(array_filter($json['data'], function ($e) {
            return $e['type'] === 'EXCLUSIVE'
                && ($this->isMG($e['title']) || $this->is2Shot($e['title']));
        }));

        return ['items' => $items, 'error' => null];
    }

    // ── Fetch detail exclusive (sesi + quota per jalur) ──────
    public function getExclusive(string $code): array {
        $code = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code));
        $url  = "https://jkt48.com/api/v1/exclusives/{$code}?lang=id";

        $result = $this->curl($url, [
            'Referer: https://jkt48.com/purchase/exclusives?code=' . $code,
        ]);

        if (!$result['ok']) return ['data' => null, 'error' => $result['error']];

        $json = json_decode($result['body'], true);
        if (empty($json['status']) || empty($json['data'])) {
            return ['data' => null, 'error' => 'Data tidak ditemukan'];
        }

        return ['data' => $json['data'], 'error' => null];
    }

    // ── cURL helper ──────────────────────────────────────────
    private function curl(string $url, array $extraHeaders = []): array {
        $cookie = implode('; ', [
            '__Secure-next-auth.session-token=' . JKT48_SESSION_TOKEN,
            'cf_clearance='                     . JKT48_CF_CLEARANCE,
            '__Host-next-auth.csrf-token='      . JKT48_CSRF_TOKEN,
        ]);

        $headers = array_merge([
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            'Accept: application/json, */*',
            'Origin: https://jkt48.com',
            'Cookie: ' . $cookie,
        ], $extraHeaders);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_ENCODING       => 'gzip, deflate',
            CURLOPT_HTTPHEADER     => $headers,
        ]);

        $body  = curl_exec($ch);
        $code  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error)       return ['ok' => false, 'error' => "cURL error: $error"];
        if ($code !== 200) return ['ok' => false, 'error' => "HTTP $code dari jkt48.com"];

        return ['ok' => true, 'body' => $body];
    }

    // ── Helpers ──────────────────────────────────────────────
    public function isMG(string $title): bool {
        return (bool) preg_match('/meet\s*(and|&|n)?\s*greet/i', $title);
    }

    public function is2Shot(string $title): bool {
        return (bool) preg_match('/2.?shot/i', $title);
    }

    public function detectTeam(string $title): string {
        if (stripos($title, 'passion') !== false) return 'passion';
        if (stripos($title, 'trainee') !== false) return 'trainee';
        // Event gabungan Love & Dream
        if (preg_match('/love.*dream|dream.*love/i', $title)) return 'multi';
        if (stripos($title, 'love')    !== false) return 'love';
        if (stripos($title, 'dream')   !== false) return 'dream';
        return 'other';
    }

    // Konversi UTC → WIB untuk display
    public function toWIB(string $isoDate): string {
        $dt = new DateTime($isoDate, new DateTimeZone('UTC'));
        $dt->setTimezone(new DateTimeZone('Asia/Jakarta'));
        return $dt->format('Y-m-d H:i:s');
    }
}
