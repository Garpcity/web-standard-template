<?php
/**
 * wp-seed.php – importerer mock-innholdet til WordPress med site-core.
 * Kjør:  wp eval-file scripts/wp-seed.php [sti-til-data-mappe] [frontend-url]
 * (Alternativ til wp-seed.sh når WP-CLI kjøres via et verktøy som Studio.)
 */


$dataDir  = $args[0] ?? (getcwd() . '/src/content/adapters/mock/data');
$frontend = rtrim($args[1] ?? 'http://localhost:3000', '/');

$read = static function (string $file) use ($dataDir): array {
    $raw = file_get_contents("$dataDir/$file");
    if ($raw === false) {
        WP_CLI::error("Fant ikke $dataDir/$file");
    }
    return json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
};
$json = static fn(mixed $v): string => wp_json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$richToHtml = static function (array $nodes): string {
    $out = [];
    foreach ($nodes as $n) {
        if (($n['_type'] ?? '') !== 'block') {
            continue;
        }
        $text = implode('', array_map(static fn($c) => esc_html($c['text'] ?? ''), $n['children'] ?? []));
        if (!empty($n['listItem'])) {
            $out[] = "<ul><li>$text</li></ul>";
        } elseif (($n['style'] ?? 'normal') === 'normal') {
            $out[] = "<p>$text</p>";
        } else {
            $tag = $n['style'];
            $out[] = "<$tag>$text</$tag>";
        }
    }
    return implode("\n", $out);
};

// Innstillinger
$site = $read('site.json');
update_option('site_core_settings', $json($site));
update_option('site_core_brand_guide', $json($read('brand-guide.json')));
update_option('site_core_redirects', $json($read('redirects.json')));
update_option('blogname', $site['name']);
update_option('blogdescription', $site['tagline'] ?? '');
update_option('permalink_structure', '/%postname%/');
flush_rewrite_rules();
WP_CLI::log('→ Innstillinger');

// Kategorier
$catMap = [];
foreach ($read('categories.json') as $c) {
    $term = get_term_by('slug', $c['slug'], 'category');
    if (!$term) {
        $res  = wp_insert_term($c['name'], 'category', ['slug' => $c['slug'], 'description' => $c['description'] ?? '']);
        $term = get_term($res['term_id'], 'category');
    }
    $catMap[$c['id']] = (int) $term->term_id;
}
WP_CLI::log('→ Kategorier: ' . count($catMap));

// Personer
$personMap = [];
foreach ($read('people.json') as $p) {
    $existing = get_page_by_path($p['slug'], OBJECT, 'person');
    $id = $existing ? $existing->ID : wp_insert_post([
        'post_type'    => 'person',
        'post_status'  => 'publish',
        'post_title'   => $p['name'],
        'post_name'    => $p['slug'],
        'post_content' => $richToHtml($p['bio'] ?? []),
    ]);
    update_post_meta($id, 'role', $p['role'] ?? '');
    update_post_meta($id, 'email', $p['email'] ?? '');
    update_post_meta($id, 'phone', $p['phone'] ?? '');
    update_post_meta($id, 'knows_about', $json($p['knowsAbout'] ?? []));
    update_post_meta($id, 'credentials', $json($p['credentials'] ?? []));
    update_post_meta($id, 'same_as', $json($p['sameAs'] ?? []));
    $personMap[$p['id']] = (int) $id;
    WP_CLI::log("   person {$p['slug']} → $id");
}

// Sider
foreach ($read('pages.json') as $pg) {
    $existing = get_page_by_path($pg['slug'], OBJECT, 'page');
    $id = $existing ? $existing->ID : wp_insert_post([
        'post_type'   => 'page',
        'post_status' => 'publish',
        'post_title'  => $pg['title'],
        'post_name'   => $pg['slug'],
    ]);
    update_post_meta($id, 'site_blocks', $json($pg['blocks']));
    update_post_meta($id, 'seo_title', $pg['seo']['title'] ?? '');
    update_post_meta($id, 'seo_description', $pg['seo']['description'] ?? '');
    update_post_meta($id, 'seo_noindex', !empty($pg['seo']['noindex']));
    if ($pg['slug'] === 'forside') {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $id);
    }
    WP_CLI::log("   side {$pg['slug']} → $id");
}

// Artikler
foreach ($read('articles.json') as $a) {
    $existing = get_page_by_path($a['slug'], OBJECT, 'post');
    $authorWp = $personMap[$a['authorId']] ?? null;
    $id = $existing ? $existing->ID : wp_insert_post([
        'post_type'     => 'post',
        'post_status'   => 'publish',
        'post_title'    => $a['title'],
        'post_name'     => $a['slug'],
        'post_date_gmt' => gmdate('Y-m-d H:i:s', strtotime($a['publishedAt'])),
        'post_date'     => get_date_from_gmt(gmdate('Y-m-d H:i:s', strtotime($a['publishedAt']))),
        'post_content'  => $richToHtml($a['body']),
        'post_category' => array_values(array_filter(array_map(static fn($c) => $catMap[$c] ?? null, $a['categoryIds'] ?? []))),
    ]);
    update_post_meta($id, 'summary', $a['summary']);
    update_post_meta($id, 'sources', $json($a['sources'] ?? []));
    // Forfatter-kobling: lagres som meta siden WP-author er en bruker, ikke en person-post.
    if ($authorWp) {
        update_post_meta($id, 'author_person_id', (string) $authorWp);
    }
    WP_CLI::log("   artikkel {$a['slug']} → $id");
}

// Menyer
foreach ($read('menus.json') as $m) {
    $menu = wp_get_nav_menu_object($m['name']);
    $menuId = $menu ? $menu->term_id : wp_create_nav_menu($m['name']);
    $existingItems = array_map(static fn($i) => $i->title, wp_get_nav_menu_items($menuId) ?: []);
    foreach ($m['items'] as $item) {
        if (in_array($item['label'], $existingItems, true)) {
            continue;
        }
        wp_update_nav_menu_item($menuId, 0, [
            'menu-item-title'  => $item['label'],
            'menu-item-url'    => $frontend . $item['href'],
            'menu-item-status' => 'publish',
            'menu-item-type'   => 'custom',
        ]);
    }
    $locations = get_theme_mod('nav_menu_locations') ?: [];
    $locations[$m['name']] = $menuId;
    set_theme_mod('nav_menu_locations', $locations);
    WP_CLI::log("   meny {$m['name']} → $menuId");
}

WP_CLI::success('Seed ferdig.');
