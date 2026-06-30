<?php

require_once __DIR__ . '/../../core/Controller.php';
require_once __DIR__ . '/../models/TimetableModel.php';

class RadarController extends Controller {

    private TimetableModel $model;

    public function __construct() {
        $this->model = new TimetableModel();
    }

    // GET /radar
    public function index(array $params = []): void {
        $this->view('radar/index', []);
    }

    // GET /api/radar?month=6&year=2026
    // Fetch semua event EXCLUSIVE bulan ini, cek quota tiap jalur
    public function apiRadar(array $params = []): void {
        $month = (int) ($_GET['month'] ?? date('n'));
        $year  = (int) ($_GET['year']  ?? date('Y'));

        $schedResult = $this->model->getSchedules($month, $year);
        if ($schedResult['error']) {
            $this->json(['alerts' => [], 'error' => $schedResult['error']]);
            return;
        }

        $alerts   = [];
        $checked  = []; // dedupe reference_code

        $today = new DateTime('today', new DateTimeZone('Asia/Jakarta'));

        foreach ($schedResult['items'] as $item) {
            // Skip event yang sudah selesai
            $eventDt = new DateTime($item['date'], new DateTimeZone('UTC'));
            $eventDt->setTimezone(new DateTimeZone('Asia/Jakarta'));
            if ($eventDt < $today) continue;

            $code = $item['reference_code'] . '-' . $eventDt->format('Ymd'); // unique per tanggal
            $refCode = $item['reference_code'];
            if (isset($checked[$code])) continue;
            $checked[$code] = true;

            $detail = $this->model->getExclusive($refCode);
            if ($detail['error'] || !$detail['data']) continue;

            $d = $detail['data'];
            foreach ($d['session'] as $sesi) {
                foreach ($sesi['session_detail'] as $slot) {
                    $quota = (int) $slot['available_quota'];

                    // Skip sold out (quota = 0) dan aman (quota > 30)
                    if ($quota === 0 || $quota > 30) continue;

                    // Konversi tanggal sesi ke WIB
                            $dtRaw   = $sesi['date'] ?? $item['date'];
                            $dtObj   = new DateTime($dtRaw, new DateTimeZone('UTC'));
                            $dtObj->setTimezone(new DateTimeZone('Asia/Jakarta'));
                            $tglWIB  = $dtObj->format('Y-m-d');
                            $tglLabel= $dtObj->format('d/m/Y');
                            $hariArr = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
                            $hari    = $hariArr[(int)$dtObj->format('w')];

                            $alerts[] = [
                        'event_code'   => $code,
                        'event_title'  => $d['title'],
                        'event_type'   => $this->model->isMG($d['title']) ? 'mg' : '2shot',
                        'team'         => $this->model->detectTeam($d['title']),
                        'session_label'=> $sesi['label'],
                        'session_start'=> substr($sesi['start_time'], 0, 5),
                        'session_end'  => substr($sesi['end_time'], 0, 5),
                        'jalur'        => $slot['label'],
                        'member'       => $slot['jkt48_member_name'],
                        'quota'        => $quota,
                        'tickets_sold' => (int) $slot['tickets_sold'],
                        'timestamp'    => time(),
                        'date_wib'     => $tglWIB,
                        'date_label'   => $hari . ', ' . $tglLabel,
                    ];
                }
            }
        }

        // Urutkan: quota terkecil dulu (paling kritis)
        usort($alerts, fn($a, $b) => $a['quota'] <=> $b['quota']);

        // Kumpulkan unique dates untuk date picker
        $dates = [];
        foreach ($alerts as $a) {
            $key = $a['date_wib'];
            if (!isset($dates[$key])) {
                $dates[$key] = $a['date_label'];
            }
        }
        ksort($dates);

        $this->json([
            'alerts'    => $alerts,
            'total'     => count($alerts),
            'checked'   => count($checked),
            'dates'     => $dates,
            'error'     => null,
            'timestamp' => time(),
        ]);
    }
}