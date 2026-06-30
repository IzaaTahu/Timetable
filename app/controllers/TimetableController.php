<?php

require_once __DIR__ . '/../../core/Controller.php';
require_once __DIR__ . '/../models/TimetableModel.php';

class TimetableController extends Controller {

    private TimetableModel $model;

    public function __construct() {
        $this->model = new TimetableModel();
    }

    // GET /
    // Halaman utama timetable
    public function index(array $params = []): void {
        $month = (int) ($_GET['month'] ?? date('n'));
        $year  = (int) ($_GET['year']  ?? date('Y'));

        // Clamp
        $month = max(1, min(12, $month));
        $year  = max(2024, min((int) date('Y') + 1, $year));

        $result = $this->model->getSchedules($month, $year);

        // Kelompokkan per team
        $byTeam = [];
        foreach ($result['items'] as $item) {
            $team = $this->model->detectTeam($item['title']);
            $byTeam[$team][] = $item;
        }

        $this->view('timetable/index', [
            'month'   => $month,
            'year'    => $year,
            'byTeam'  => $byTeam,
            'items'   => $result['items'],
            'error'   => $result['error'],
            'model'   => $this->model,
        ]);
    }

    // GET /api/schedules?month=6&year=2026
    // JSON endpoint untuk AJAX refresh
    public function apiSchedules(array $params = []): void {
        $month = (int) ($_GET['month'] ?? date('n'));
        $year  = (int) ($_GET['year']  ?? date('Y'));

        $result = $this->model->getSchedules($month, $year);

        // Tambah info team & tipe ke tiap item
        foreach ($result['items'] as &$item) {
            $item['team']    = $this->model->detectTeam($item['title']);
            $item['is_mg']   = $this->model->isMG($item['title']);
            $item['is_2shot']= $this->model->is2Shot($item['title']);
            $item['date_wib']= $this->model->toWIB($item['date']);
        }

        $this->json($result);
    }

    // GET /api/exclusive/:code
    // JSON endpoint untuk detail quota per sesi per jalur
    public function apiExclusive(array $params = []): void {
        $code = $params['code'] ?? '';
        if (!$code) {
            $this->json(['data' => null, 'error' => 'Code diperlukan'], 400);
            return;
        }

        $result = $this->model->getExclusive($code);
        $this->json($result);
    }
}
