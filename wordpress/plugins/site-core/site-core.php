<?php
/**
 * Plugin Name: Site Core
 * Description: Innholdsmodell for nettsider bygget på Standard for nettsideutvikling. Registrerer post types, felter, innstillinger og GraphQL-/REST-endepunkter. Strukturen speiler Zod-skjemaene i repoet (generated/json-schema).
 * Version: 0.1.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Requires Plugins: wp-graphql
 * License: MIT
 * Text Domain: site-core
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

define('SITE_CORE_VERSION', '0.1.0');
define('SITE_CORE_DIR', plugin_dir_path(__FILE__));

require_once SITE_CORE_DIR . 'includes/post-types.php';
require_once SITE_CORE_DIR . 'includes/fields.php';
require_once SITE_CORE_DIR . 'includes/options.php';
require_once SITE_CORE_DIR . 'includes/graphql.php';
require_once SITE_CORE_DIR . 'includes/rest.php';
require_once SITE_CORE_DIR . 'includes/roles.php';
require_once SITE_CORE_DIR . 'includes/hardening.php';

add_action('init', 'site_core_register_post_types');
add_action('init', 'site_core_register_fields');
add_action('init', 'site_core_register_options');
add_action('init', 'site_core_register_menus');
add_action('graphql_register_types', 'site_core_register_graphql');
add_action('rest_api_init', 'site_core_register_rest');
add_action('init', 'site_core_register_roles');

register_activation_hook(__FILE__, static function (): void {
    site_core_register_post_types();
    site_core_register_roles();
    flush_rewrite_rules();
});

/**
 * Menyplasseringer: speiler Menu.name i kontrakten.
 */
function site_core_register_menus(): void
{
    register_nav_menus([
        'main'   => __('Hovedmeny', 'site-core'),
        'footer' => __('Bunnmeny', 'site-core'),
        'legal'  => __('Juridisk', 'site-core'),
    ]);
}
