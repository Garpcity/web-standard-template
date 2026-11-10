<?php
/**
 * On-demand revalidering av frontend (Next.js) når innhold lagres i WordPress.
 * Konfig i wp-config.php eller som options:
 *   define('SITE_CORE_FRONTEND_URL', 'https://kunde.no');
 *   define('SITE_CORE_REVALIDATE_SECRET', '…');   // = REVALIDATE_SECRET i frontend
 * Uten konfig gjør hooken ingenting (lokal utvikling bruker ISR-sikkerhetsnettet).
 */

declare(strict_types=1);

function site_core_frontend_url(): string
{
    if (defined('SITE_CORE_FRONTEND_URL')) {
        return rtrim((string) SITE_CORE_FRONTEND_URL, '/');
    }
    return rtrim((string) get_option('site_core_frontend_url', ''), '/');
}

function site_core_revalidate_secret(): string
{
    if (defined('SITE_CORE_REVALIDATE_SECRET')) {
        return (string) SITE_CORE_REVALIDATE_SECRET;
    }
    return (string) get_option('site_core_revalidate_secret', '');
}

/**
 * @return array<string, mixed>|null  svar fra frontend, null hvis ikke konfigurert
 */
function site_core_revalidate(string $kind, ?string $slug = null): ?array
{
    $url    = site_core_frontend_url();
    $secret = site_core_revalidate_secret();
    if ($url === '' || $secret === '') {
        return null;
    }
    $res = wp_remote_post($url . '/api/revalidate', [
        'timeout' => 5,
        'blocking' => true,
        'headers' => ['Content-Type' => 'application/json', 'x-revalidate-secret' => $secret],
        'body'    => wp_json_encode(array_filter(['kind' => $kind, 'slug' => $slug])),
    ]);
    if (is_wp_error($res)) {
        error_log('[site-core] revalidate feilet: ' . $res->get_error_message());
        return null;
    }
    $body = json_decode((string) wp_remote_retrieve_body($res), true);
    return is_array($body) ? $body : null;
}

function site_core_revalidate_post(int $post_id, WP_Post $post): void
{
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }
    $kind = match ($post->post_type) {
        'page'   => 'page',
        'post'   => 'article',
        'person' => 'person',
        default  => null,
    };
    if ($kind === null) {
        return;
    }
    $slug = $post->post_type === 'page' && (int) get_option('page_on_front') === $post_id ? 'forside' : $post->post_name;
    site_core_revalidate($kind, $slug);
}

function site_core_register_revalidate(): void
{
    add_action('save_post', 'site_core_revalidate_post', 20, 2);
    add_action('deleted_post', static function (int $post_id, WP_Post $post): void {
        site_core_revalidate_post($post_id, $post);
    }, 10, 2);
    add_action('update_option_site_core_settings', static fn() => site_core_revalidate('settings'));
    add_action('update_option_site_core_brand_guide', static fn() => site_core_revalidate('brandGuide'));
    add_action('update_option_site_core_redirects', static fn() => site_core_revalidate('redirect'));
    add_action('wp_update_nav_menu', static fn() => site_core_revalidate('menu'));
    add_action('edited_category', static fn() => site_core_revalidate('category'));
}
