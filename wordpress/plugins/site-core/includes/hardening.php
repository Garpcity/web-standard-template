<?php
/**
 * Herding for headless drift. WordPress er kun admin + API; frontend er Next.js.
 */

declare(strict_types=1);

// Ingen offentlig frontend fra WordPress: send besøkende til Next.js-siden.
add_action('template_redirect', static function (): void {
    if (is_admin() || wp_doing_ajax() || defined('REST_REQUEST') || defined('GRAPHQL_REQUEST')) {
        return;
    }
    if (is_feed() || is_robots()) {
        return;
    }
    $frontend = defined('SITE_CORE_FRONTEND_URL') ? SITE_CORE_FRONTEND_URL : '';
    if ($frontend !== '' && !is_user_logged_in()) {
        wp_redirect(rtrim($frontend, '/') . $_SERVER['REQUEST_URI'], 302);
        exit;
    }
});

// Skru av ting en headless side ikke trenger.
add_filter('xmlrpc_enabled', '__return_false');
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');
add_filter('rest_endpoints', static function (array $endpoints): array {
    // Skjul brukerlisten for uautentiserte.
    if (!is_user_logged_in()) {
        unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});

// Application Passwords kreves for REST-skriving fra frontend/Studio.
add_filter('wp_is_application_passwords_available', '__return_true');
