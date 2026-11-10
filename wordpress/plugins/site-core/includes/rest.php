<?php
/**
 * REST-endepunkter for frontend-editoren (Puck) og forhåndsvisning.
 * Autentisering: WordPress Application Passwords (Basic auth over HTTPS).
 */

declare(strict_types=1);

function site_core_register_rest(): void
{
    register_rest_route('site-core/v1', '/pages/(?P<slug>[a-z0-9-]+)/blocks', [
        [
            'methods'             => 'GET',
            'permission_callback' => static fn(): bool => current_user_can('edit_pages'),
            'callback'            => 'site_core_rest_get_blocks',
        ],
        [
            'methods'             => 'POST',
            'permission_callback' => static fn(): bool => current_user_can('edit_pages'),
            'callback'            => 'site_core_rest_save_blocks',
            'args'                => [
                'blocks' => ['required' => true, 'type' => 'array'],
                'title'  => ['required' => false, 'type' => 'string'],
            ],
        ],
    ]);

    register_rest_route('site-core/v1', '/preview-token', [
        'methods'             => 'POST',
        'permission_callback' => static fn(): bool => current_user_can('edit_posts'),
        'callback'            => static fn(): array => ['token' => site_core_preview_token()],
    ]);
}

function site_core_find_page(string $slug): ?WP_Post
{
    $slug = $slug === 'forside' ? get_post_field('post_name', (int) get_option('page_on_front')) : $slug;
    $page = get_page_by_path($slug, OBJECT, 'page');
    return $page instanceof WP_Post ? $page : null;
}

function site_core_rest_get_blocks(WP_REST_Request $req): WP_REST_Response|WP_Error
{
    $page = site_core_find_page((string) $req['slug']);
    if (!$page) {
        return new WP_Error('not_found', 'Siden finnes ikke', ['status' => 404]);
    }
    $raw = get_post_meta($page->ID, 'site_blocks', true);
    return new WP_REST_Response([
        'id'     => $page->ID,
        'slug'   => $page->post_name,
        'title'  => $page->post_title,
        'blocks' => $raw ? json_decode((string) $raw, true) : [],
    ]);
}

function site_core_rest_save_blocks(WP_REST_Request $req): WP_REST_Response|WP_Error
{
    $page = site_core_find_page((string) $req['slug']);
    if (!$page) {
        return new WP_Error('not_found', 'Siden finnes ikke', ['status' => 404]);
    }
    $blocks = $req->get_param('blocks');
    $json   = wp_json_encode($blocks, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return new WP_Error('invalid', 'Ugyldige blokker', ['status' => 400]);
    }
    update_post_meta($page->ID, 'site_blocks', $json);
    if ($title = $req->get_param('title')) {
        wp_update_post(['ID' => $page->ID, 'post_title' => sanitize_text_field((string) $title)]);
    }
    return new WP_REST_Response(['ok' => true, 'id' => $page->ID]);
}

/**
 * Kortlivet token for forhåndsvisning av utkast i frontend.
 */
function site_core_preview_token(): string
{
    $secret = defined('SITE_CORE_PREVIEW_SECRET') ? SITE_CORE_PREVIEW_SECRET : wp_salt('auth');
    $exp    = time() + 600;
    return $exp . '.' . hash_hmac('sha256', (string) $exp, $secret);
}

function site_core_verify_preview_token(string $token): bool
{
    [$exp, $sig] = array_pad(explode('.', $token, 2), 2, '');
    if ((int) $exp < time()) {
        return false;
    }
    $secret = defined('SITE_CORE_PREVIEW_SECRET') ? SITE_CORE_PREVIEW_SECRET : wp_salt('auth');
    return hash_equals(hash_hmac('sha256', $exp, $secret), $sig);
}
