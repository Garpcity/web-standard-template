<?php
/**
 * Post types. Page og Article bruker WordPress sine innebygde `page` og `post`.
 * Person er egen CPT. Category er innebygd taksonomi.
 */

declare(strict_types=1);

function site_core_register_post_types(): void
{
    register_post_type('person', [
        'label'               => __('Personer', 'site-core'),
        'labels'              => [
            'singular_name' => __('Person', 'site-core'),
            'add_new_item'  => __('Legg til person', 'site-core'),
            'edit_item'     => __('Rediger person', 'site-core'),
        ],
        'public'              => true,
        'publicly_queryable'  => false,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'person',
        'graphql_plural_name' => 'people',
        'menu_icon'           => 'dashicons-groups',
        'supports'            => ['title', 'editor', 'thumbnail', 'custom-fields', 'revisions'],
        'has_archive'         => false,
        'rewrite'             => ['slug' => 'person'],
    ]);

    // Innebygde typer eksponeres i GraphQL av WPGraphQL. Vi sikrer REST + revisjoner.
    add_post_type_support('page', 'custom-fields');
    add_post_type_support('post', 'custom-fields');
    add_post_type_support('post', 'excerpt');
}
