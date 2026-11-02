# Forum list "What's new" activity feed (XenForo 2.2.8 Patch 1)

This adds a tabbed list of recent threads above the node list on `forum_list`. It is built on XenForo's own **New posts** widget, so it handles permissions and unread state itself.

## Files

| File | Where it goes |
|---|---|
| `forum_list.html` | Replace the contents of the **forum_list** template |
| `ts_activity_feed.html` | Public template **ts_activity_feed** |
| `ts_activity_feed.less` | Public template **ts_activity_feed.less** |
| `account_bookmarks.html` | Replace the contents of the **account_bookmarks** template (your copy plus a hidden block at the end) |

## Install

1. **Appearance → Templates**: add or update `ts_activity_feed` and `ts_activity_feed.less`.
2. **Appearance → Templates → `widget_new_posts`**: only change how it renders on `forum_list`.
   - First get the stock template back. If you replaced it, use **Revert** on `widget_new_posts` in the template list for your style.
   - At the **very top**, before the first line, paste:
     ```
     <xf:if is="$xf.reply.template == 'forum_list'">
     	<xf:macro template="ts_activity_feed" name="list" arg-threads="{$threads}" arg-link="{$link}" arg-hasMore="{$hasMore}" />
     <xf:else />
     ```
   - At the **very bottom**, after the last line, paste:
     ```
     </xf:if>
     ```
   `$xf.reply.template` is the name of the page being shown. On the forum list every New posts widget uses the feed layout, and on every other page (the What's New page, thread pages, sidebars) the widget stays stock.
3. **Appearance → Widgets → Add widget → New posts**. Create these widgets with **no display position ticked**:

   | Widget key | Maximum entries | Forum limit |
   |---|---|---|
   | `ts_activity_all` | 12 | (none / all forums) |
   | `ts_activity_regions` | 12 | Season 5 (11), Campaign (56), Tangleweaves (12), Zalra (13), Hylands (15), Astorea (16), Falderen (17), Temeria (19), Lament (57), Misc (20), Real Life (21), Comms (22) |
   | `ts_activity_season` (tab "Season 5") | 12 | Season 5 (11) + Campaign (56). Repoint at the next season later |
   | `ts_activity_meta` (tab "Meta") | 12 | Trackers (6), DM Hub (9), Quest (8), LFGs (7), Apps (5), News (4), Services (26), Archive (25), OOC (52) |
   | `ts_activity_watched` (tab "Watched") | 12 | none (all forums). **Filter: Watched** |

   Filter: *Latest*. Display style doesn't matter. Forum limit only matches threads posted directly in the selected forums, so also select any sub-forums.
4. Replace **forum_list** with `forum_list.html`.

## Thumbnails

- **Regions** (11, 56, 12, 13, 15, 16, 17, 19, 57, 20, 21, 22) show `/db/forums/id_XX.webp`, for example `/db/forums/id_17.webp` for Falderen. Upload one per forum. Images are cropped to fill the 62×36 tile (46×30 on mobile).
- **Community / Guild Hall** show a Font Awesome icon on a tinted tile:

  | Forum | Icon | Tint |
  |---|---|---|
  | Services 26 | `fa-solid fa-bell` | gold |
  | Archive 25 | `fa-solid fa-globe-stand` | sky blue |
  | OOC 52 | `fa-solid fa-mug-hot` | copper |
  | Trackers 6 | `fa-solid fa-clipboard-list` | green |
  | DM Hub 9 | `fa-regular fa-book-open-reader` | purple |
  | Quest 8 | `fa-solid fa-mandolin ni38` | red |
  | LFGs 7 | `fa-solid fa-user-magnifying-glass` | pink |
  | Apps 5 | `fa-solid fa-id-badge` | teal |
  | News 4 | `fa-solid fa-bullhorn` | blue |
  | Rewards 41 | `fa-solid fa-gem` | diamond cyan |
  | BBcoding 58 | `fa-solid fa-code` | steel blue |
  | Property 63 | `fa-solid fa-house` | tan |
  | Gallery 74 | `fa-solid fa-images` | violet |
  | Active Player 30 | `fa-solid fa-user` | mint green |

  The icon list is in the `thumb` macro of `ts_activity_feed`, and the tints are at the bottom of `ts_activity_feed.less`.
- Any other forum gets a plain dark gradient tile.

## Wiki tab

Near the top of the feed block in `forum_list`:

```
<xf:set var="$tsShowWiki" value="1" />
```

`$tsShowSeason`, `$tsShowWatched`, `$tsShowBookmarks` and `$tsShowWiki` sit together there. Set any of them to `0` to hide that tab and its pane.

Each link is one line, drawn exactly like a thread row:

```
<xf:macro template="ts_activity_feed" name="wiki_row"
	arg-href="https://terrarp.com/wiki/rules/"
	arg-title="Rules"
	arg-icon="fa-solid fa-scale-balanced"
	arg-labels="{{ ['Required'] }}"
	arg-sub="Community and roleplay" />
```

Only `href` and `title` are required. Optional arguments:

| Argument | What it does |
|---|---|
| `icon` | Font Awesome icon on a teal tile |
| `image` | Thumbnail URL, replaces the icon |
| `labels` | Up to three pills |
| `section` | Text after "in" (default Wiki) |
| `byline` | Bold name on the right (default Wiki) |
| `sub` | Small line under the name |

The four links currently in it are placeholders.

## Watched and Bookmarks tabs (members only)

- **Watched:** a New posts widget with key `ts_activity_watched` and its Filter set to *Watched* (see the table above).
  - **Unwatch:** hovering a row in this tab shows a `fa-eye-slash` button (always visible on touch screens). Clicking it unwatches the thread in the background. The row fades and is struck through, with an **Undo** that watches it again, without email notifications. The button only appears in the Watched tab.
  - **Sort:** while the Watched tab is open, the "Sorted by" text becomes a button that cycles *latest post* (default) → *unread first* → *newest thread*. Unread first puts threads with new posts on top, each group by latest post. Newest thread sorts by when the thread was started, and the rows show "Started …" instead of the last post time. Each browser remembers the choice. (XenForo doesn't store when you started watching a thread, so "date added" isn't possible here.)
- **Bookmarks:** loads `/account/bookmarks` the first time the tab is clicked. `account_bookmarks` has a hidden block at the end that renders each bookmark with `ts_activity_feed::bookmark_row`, and the tab shows only that block. Thread and post bookmarks get their thread's thumbnail, prefix and "in Forum". Your bookmark labels become the pills, and the right side shows the content's author with the date you bookmarked it. Other bookmark types (profile posts and so on) get a gold bookmark tile.
  - **Sort:** while the Bookmarks tab is open, the "Sorted by latest post" text becomes a button that switches between *latest post* (default) and *date added*. The time on each row follows the choice (last post time, or a bookmark icon with the date you bookmarked it). Each browser remembers the choice. It sorts the bookmarks already loaded, which are the newest page of `/account/bookmarks`.
  - **Remove:** hovering a bookmark row shows a `fa-bookmark-slash` button (always visible on touch screens). Clicking it removes the bookmark in the background. The row fades and is struck through, with an **Undo** button that bookmarks it again (without the old note or labels).

Both are hidden for guests. Switches: `$tsShowWatched`, `$tsShowBookmarks`.

## Size controls

The bar at the bottom of the box has:

- **Grip:** drag it to set the height. The list scrolls inside.
- **Default:** 415px, which is also what everyone starts with. If there isn't enough content to fill 415px, the box is simply shorter. Change `DEFAULT = 415` in the script in `forum_list` to adjust it.
- **Full:** removes any height limit.
- **Hide:** collapses to the tab bar, with a "Show" button on the right.

Each browser remembers its own choice (localStorage), and the last tab opened. If that tab is switched off or members-only, the box falls back to All activity.
