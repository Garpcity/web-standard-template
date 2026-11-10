<?php
/**
 * Roller speiler src/content/permissions.ts:
 *   owner → administrator, admin → site_admin, editor → editor,
 *   contributor → contributor, reviewer → site_reviewer, agent → site_agent.
 */

declare(strict_types=1);

function site_core_register_roles(): void
{
    if (!get_role('site_admin')) {
        $editor = get_role('editor');
        add_role('site_admin', __('Kundeadmin', 'site-core'), array_merge(
            $editor ? $editor->capabilities : [],
            ['list_users' => true, 'create_users' => true, 'edit_users' => true, 'manage_options' => false],
        ));
    }
    if (!get_role('site_reviewer')) {
        add_role('site_reviewer', __('Godkjenner', 'site-core'), [
            'read'               => true,
            'edit_posts'         => false,
            'publish_posts'      => true,
            'publish_pages'      => true,
            'edit_others_posts'  => true,
            'edit_others_pages'  => true,
            'read_private_posts' => true,
            'read_private_pages' => true,
        ]);
    }
    if (!get_role('site_agent')) {
        // Kundens AI via MCP: lese alt, lage utkast, aldri publisere.
        add_role('site_agent', __('AI-agent', 'site-core'), [
            'read'               => true,
            'edit_posts'         => true,
            'edit_pages'         => true,
            'upload_files'       => true,
            'publish_posts'      => false,
            'publish_pages'      => false,
            'delete_posts'       => false,
            'delete_pages'       => false,
            'read_private_posts' => true,
            'read_private_pages' => true,
        ]);
    }
}
