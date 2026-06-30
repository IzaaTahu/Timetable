<?php

class Controller {
    protected function view(string $path, array $data = []): void {
        extract($data);
        $viewFile = __DIR__ . '/../app/views/' . $path . '.php';
        if (!file_exists($viewFile)) {
            http_response_code(500);
            echo "View tidak ditemukan: $path";
            return;
        }
        require $viewFile;
    }

    protected function redirect(string $url): void {
        if (str_starts_with($url, 'http')) {
            header("Location: $url");
        } else {
            header("Location: " . url($url));
        }
        exit;
    }

    protected function json(mixed $data, int $code = 200): void {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    protected function isLoggedIn(): bool {
        return isset($_SESSION['user_id']);
    }

    protected function requireLogin(): void {
        if (!$this->isLoggedIn()) {
            $this->redirect('/login');
        }
    }

    protected function requireAdmin(): void {
        $this->requireLogin();
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo "Akses ditolak.";
            exit;
        }
    }

    protected function asset(string $path): string {
        return BASE_URL . '/public/' . ltrim($path, '/');
    }
}
