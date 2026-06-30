<?php
require_once 'config/credentials.php';

$ch = curl_init('https://jkt48.com/api/v1/schedules?lang=id&month=6&year=2026');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_VERBOSE        => true,
    CURLOPT_ENCODING       => 'gzip, deflate',
    CURLOPT_HTTPHEADER => [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Accept: application/json, */*',
        'Origin: https://jkt48.com',
        'Referer: https://jkt48.com/',
        'Cookie: __Secure-next-auth.session-token=' . JKT48_SESSION_TOKEN . '; cf_clearance=' . JKT48_CF_CLEARANCE . '; __Host-next-auth.csrf-token=' . JKT48_CSRF_TOKEN,
    ],
]);

$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $code\n\n";
echo $body;