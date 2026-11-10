<?php
/**
 * Globale innstillinger: SiteSettings, BrandGuide og Redirects lagres som JSON i
 * wp_options og redigeres via REST (Studio / frontend-admin) eller WP-CLI:
 *   wp option update site_core_settings "$(cat site.json)" --format=json
 */

declare(strict_types=1);

const SITE_CORE_OPTIONS = [
    'site_core_settings'    => 'SiteSettings (JSON)',
    'site_core_brand_guide' => 'BrandGuide (JSON)',
    'site_core_redirects'   => 'Redirect[] (JSON)',
];

function site_core_register_options(): void
{
    foreach (SITE_CORE_OPTIONS as $name => $description) {
        register_setting('site_core', $name, [
            'type'              => 'string',
            'description'       => $description,
            'show_in_rest'      => ['schema' => ['type' => 'string']],
            'sanitize_callback' => 'site_core_sanitize_json',
            'default'           => '',
        ]);
    }
}

/**
 * @return array<string, mixed>|null
 */
function site_core_get_json_option(string $name): ?array
{
    $raw = get_option($name, '');
    if (!is_string($raw) || $raw === '') {
        return null;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}
