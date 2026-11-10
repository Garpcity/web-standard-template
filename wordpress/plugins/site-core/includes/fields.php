<?php
/**
 * Felter (post meta). Definisjonene speiler generated/json-schema. Alle felt er
 * tilgjengelige i REST (for Puck/Studio) og GraphQL (for frontend).
 *
 * Konvensjon: JSON-felt lagres som JSON-streng i meta og dekodes i adapteren.
 */

declare(strict_types=1);

/**
 * @return array<string, array<string, array{type:string, description:string, json?:bool, single?:bool}>>
 */
function site_core_field_definitions(): array
{
    return [
        'page' => [
            // Puck/kontrakt: Block[] som JSON. Redigeres i /edit/[slug] i frontend.
            'site_blocks'         => ['type' => 'string', 'json' => true, 'description' => 'Innholdsblokker (Block[] JSON)'],
            'seo_title'           => ['type' => 'string', 'description' => 'SEO-tittel'],
            'seo_description'     => ['type' => 'string', 'description' => 'SEO-beskrivelse'],
            'seo_noindex'         => ['type' => 'boolean', 'description' => 'noindex'],
            'seo_canonical'       => ['type' => 'string', 'description' => 'Kanonisk URL'],
            'seo_image_id'        => ['type' => 'integer', 'description' => 'Delingsbilde (attachment-ID)'],
        ],
        'post' => [
            'summary'             => ['type' => 'string', 'description' => 'Kort svar øverst (40–60 ord)'],
            'sources'             => ['type' => 'string', 'json' => true, 'description' => 'Kilder (LinkRef[] JSON)'],
            'seo_title'           => ['type' => 'string', 'description' => 'SEO-tittel'],
            'seo_description'     => ['type' => 'string', 'description' => 'SEO-beskrivelse'],
            'seo_noindex'         => ['type' => 'boolean', 'description' => 'noindex'],
            'seo_canonical'       => ['type' => 'string', 'description' => 'Kanonisk URL'],
            'seo_image_id'        => ['type' => 'integer', 'description' => 'Delingsbilde (attachment-ID)'],
        ],
        'person' => [
            'role'                => ['type' => 'string', 'description' => 'Rolle/tittel'],
            'email'               => ['type' => 'string', 'description' => 'E-post'],
            'phone'               => ['type' => 'string', 'description' => 'Telefon'],
            'knows_about'         => ['type' => 'string', 'json' => true, 'description' => 'Fagområder (string[] JSON)'],
            'credentials'         => ['type' => 'string', 'json' => true, 'description' => 'Kvalifikasjoner (string[] JSON)'],
            'same_as'             => ['type' => 'string', 'json' => true, 'description' => 'Offisielle profiler (string[] JSON)'],
        ],
    ];
}

function site_core_register_fields(): void
{
    foreach (site_core_field_definitions() as $postType => $fields) {
        foreach ($fields as $key => $def) {
            register_post_meta($postType, $key, [
                'type'              => $def['type'],
                'description'       => $def['description'],
                'single'            => true,
                'show_in_rest'      => true,
                'auth_callback'     => static fn(): bool => current_user_can('edit_posts'),
                'sanitize_callback' => match ($def['type']) {
                    'boolean' => 'rest_sanitize_boolean',
                    'integer' => 'absint',
                    default   => !empty($def['json']) ? 'site_core_sanitize_json' : 'sanitize_text_field',
                },
            ]);
        }
    }
}

/**
 * Godtar kun gyldig JSON. Ugyldig input blir tom streng.
 */
function site_core_sanitize_json(mixed $value): string
{
    if (!is_string($value) || $value === '') {
        return '';
    }
    json_decode($value, true);
    return json_last_error() === JSON_ERROR_NONE ? $value : '';
}
