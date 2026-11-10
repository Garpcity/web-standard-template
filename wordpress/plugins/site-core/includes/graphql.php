<?php
/**
 * GraphQL-felter (WPGraphQL). Frontend-adapteren leser alt herfra.
 * Meta eksponeres per post type; globale JSON-innstillinger som rotfelt.
 */

declare(strict_types=1);

function site_core_register_graphql(): void
{
    if (!function_exists('register_graphql_field')) {
        return;
    }

    $typeMap = ['page' => 'Page', 'post' => 'Post', 'person' => 'Person'];

    foreach (site_core_field_definitions() as $postType => $fields) {
        $graphqlType = $typeMap[$postType];
        foreach ($fields as $key => $def) {
            $fieldName = lcfirst(str_replace('_', '', ucwords($key, '_')));
            register_graphql_field($graphqlType, $fieldName, [
                'type'        => match ($def['type']) { 'boolean' => 'Boolean', 'integer' => 'Int', default => 'String' },
                'description' => $def['description'],
                'resolve'     => static function ($post) use ($key, $def) {
                    $value = get_post_meta($post->databaseId, $key, true);
                    return match ($def['type']) {
                        'boolean' => (bool) $value,
                        'integer' => $value === '' ? null : (int) $value,
                        default   => $value === '' ? null : (string) $value,
                    };
                },
            ]);
        }
    }

    // Delingsbilde som MediaItem (oppløst fra seo_image_id).
    foreach (['Page', 'Post'] as $t) {
        register_graphql_field($t, 'seoImage', [
            'type'    => 'MediaItem',
            'resolve' => static function ($post, $args, $context) {
                $id = (int) get_post_meta($post->databaseId, 'seo_image_id', true);
                return $id > 0 ? $context->get_loader('post')->load_deferred($id) : null;
            },
        ]);
    }

    // Globale JSON-innstillinger.
    foreach (SITE_CORE_OPTIONS as $option => $description) {
        $fieldName = lcfirst(str_replace(' ', '', ucwords(str_replace(['site_core_', '_'], ['', ' '], $option))));
        register_graphql_field('RootQuery', $fieldName, [
            'type'        => 'String',
            'description' => $description,
            'resolve'     => static fn(): ?string => (get_option($option, '') ?: null),
        ]);
    }
}
