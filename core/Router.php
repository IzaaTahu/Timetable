<?php

class Router {
    private array $routes = [];

    public function get(string $path, string $controller, string $method): void {
        $this->routes[] = ['method' => 'GET', 'path' => $path, 'controller' => $controller, 'action' => $method];
    }

    public function post(string $path, string $controller, string $method): void {
        $this->routes[] = ['method' => 'POST', 'path' => $path, 'controller' => $controller, 'action' => $method];
    }

    public function dispatch(): void {
        $requestMethod = $_SERVER['REQUEST_METHOD'];
        $requestUri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        if ($scriptDir && stripos($requestUri, $scriptDir) === 0) {
            $requestUri = substr($requestUri, strlen($scriptDir));
        }
        $requestUri = rtrim($requestUri, '/') ?: '/';

        foreach ($this->routes as $route) {
            $pattern = $this->buildPattern($route['path']);
            if ($route['method'] === $requestMethod && preg_match($pattern, $requestUri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                $controllerFile = __DIR__ . '/../app/controllers/' . $route['controller'] . '.php';
                if (!file_exists($controllerFile)) {
                    $this->abort(500, "Controller tidak ditemukan: {$route['controller']}");
                    return;
                }

                require_once $controllerFile;
                $ctrl = new $route['controller']();
                $ctrl->{$route['action']}($params);
                return;
            }
        }

        $this->abort(404, 'Halaman tidak ditemukan.');
    }

    private function buildPattern(string $path): string {
        $pattern = preg_replace('/\/:([a-zA-Z_]+)/', '/(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    private function abort(int $code, string $message): void {
        http_response_code($code);
        echo "<h1>$code</h1><p>$message</p>";
    }
}
