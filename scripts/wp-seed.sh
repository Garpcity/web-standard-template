#!/usr/bin/env bash
# wp-seed.sh – importerer mock-innholdet til en WordPress-installasjon med site-core.
#
# Bruk:  scripts/wp-seed.sh [wp-cli-prefiks]
#   Lokalt (WordPress Studio):   scripts/wp-seed.sh "wp"
#   Docker compose:              scripts/wp-seed.sh "docker compose exec -T wordpress wp --allow-root"
#
# Krever: jq, WPGraphQL og site-core aktivert.
set -euo pipefail

WP=${1:-wp}
DATA=src/content/adapters/mock/data
FRONT=${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}

command -v jq >/dev/null || { echo "jq mangler"; exit 1; }

echo "→ Innstillinger"
$WP option update site_core_settings "$(cat $DATA/site.json)" >/dev/null
$WP option update site_core_brand_guide "$(cat $DATA/brand-guide.json)" >/dev/null
$WP option update site_core_redirects "$(cat $DATA/redirects.json)" >/dev/null
$WP option update blogname "$(jq -r .name $DATA/site.json)" >/dev/null
$WP option update blogdescription "$(jq -r '.tagline // ""' $DATA/site.json)" >/dev/null
$WP option update permalink_structure "/%postname%/" >/dev/null
$WP rewrite flush >/dev/null

echo "→ Kategorier"
jq -c '.[]' $DATA/categories.json | while read -r c; do
  slug=$(jq -r .slug <<<"$c"); name=$(jq -r .name <<<"$c")
  $WP term get category "$slug" --by=slug --field=term_id >/dev/null 2>&1 || $WP term create category "$name" --slug="$slug" >/dev/null
done

echo "→ Personer"
declare -A PERSON_ID
jq -c '.[]' $DATA/people.json | while read -r p; do
  slug=$(jq -r .slug <<<"$p")
  id=$($WP post list --post_type=person --name="$slug" --field=ID --posts_per_page=1)
  if [ -z "$id" ]; then
    id=$($WP post create --post_type=person --post_status=publish --post_title="$(jq -r .name <<<"$p")" --post_name="$slug" --porcelain)
  fi
  $WP post meta update "$id" role "$(jq -r '.role // ""' <<<"$p")" >/dev/null
  $WP post meta update "$id" email "$(jq -r '.email // ""' <<<"$p")" >/dev/null
  $WP post meta update "$id" knows_about "$(jq -c .knowsAbout <<<"$p")" >/dev/null
  $WP post meta update "$id" credentials "$(jq -c .credentials <<<"$p")" >/dev/null
  $WP post meta update "$id" same_as "$(jq -c .sameAs <<<"$p")" >/dev/null
  echo "   $slug → $id"
done

echo "→ Sider"
jq -c '.[]' $DATA/pages.json | while read -r pg; do
  slug=$(jq -r .slug <<<"$pg")
  id=$($WP post list --post_type=page --name="$slug" --field=ID --posts_per_page=1)
  if [ -z "$id" ]; then
    id=$($WP post create --post_type=page --post_status=publish --post_title="$(jq -r .title <<<"$pg")" --post_name="$slug" --porcelain)
  fi
  $WP post meta update "$id" site_blocks "$(jq -c .blocks <<<"$pg")" >/dev/null
  $WP post meta update "$id" seo_description "$(jq -r '.seo.description // ""' <<<"$pg")" >/dev/null
  if [ "$slug" = "forside" ]; then
    $WP option update show_on_front page >/dev/null
    $WP option update page_on_front "$id" >/dev/null
  fi
  echo "   $slug → $id"
done

echo "→ Artikler"
jq -c '.[]' $DATA/articles.json | while read -r a; do
  slug=$(jq -r .slug <<<"$a")
  id=$($WP post list --post_type=post --name="$slug" --field=ID --posts_per_page=1)
  if [ -z "$id" ]; then
    # Brødtekst: enkel RichText → HTML for seed. Produksjon redigeres i Gutenberg.
    html=$(jq -r '[.body[] | select(._type=="block") | if .style=="h2" then "<h2>"+(.children|map(.text)|join(""))+"</h2>" elif .listItem then "<ul><li>"+(.children|map(.text)|join(""))+"</li></ul>" else "<p>"+(.children|map(.text)|join(""))+"</p>" end] | join("\n")' <<<"$a")
    id=$($WP post create --post_type=post --post_status=publish --post_title="$(jq -r .title <<<"$a")" --post_name="$slug" --post_date="$(jq -r .publishedAt <<<"$a" | sed 's/T/ /; s/\..*//')" --post_content="$html" --porcelain)
  fi
  $WP post meta update "$id" summary "$(jq -r .summary <<<"$a")" >/dev/null
  $WP post meta update "$id" sources "$(jq -c .sources <<<"$a")" >/dev/null
  echo "   $slug → $id"
done

echo "→ Menyer"
for loc in main footer legal; do
  menu_id=$($WP menu list --fields=term_id,slug --format=csv | awk -F, -v s="$loc" '$2==s{print $1}')
  if [ -z "$menu_id" ]; then
    menu_id=$($WP menu create "$loc" --porcelain)
  fi
  jq -c --arg n "$loc" '.[] | select(.name==$n) | .items[]' $DATA/menus.json | while read -r it; do
    label=$(jq -r .label <<<"$it"); href=$(jq -r .href <<<"$it")
    $WP menu item list "$menu_id" --fields=title --format=csv | grep -qx "$label" || $WP menu item add-custom "$menu_id" "$label" "$FRONT$href" >/dev/null
  done
  $WP menu location assign "$menu_id" "$loc" >/dev/null 2>&1 || true
done

echo "Ferdig. Test: curl -s \$WORDPRESS_GRAPHQL_URL -H 'Content-Type: application/json' -d '{\"query\":\"{ settings pages { nodes { slug } } }\"}'"
