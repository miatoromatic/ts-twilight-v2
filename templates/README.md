# Forum list "What's new" activity feed (XenForo 2.2.8 Patch 1)

This adds a tabbed list of recent threads above the node list on `forum_list`. It is built on XenForo's own **New posts** widget, so it handles permissions and unread state itself.

## Files

| File | Where it goes |
|---|---|
| `forum_list.html` | Replace the contents of the **forum_list** template |
| `ts_activity_feed.html` | Public template **ts_activity_feed** |
| `ts_activity_feed.less` | Public template **ts_activity_feed.less** |

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
3. **Appearance → Widgets → Add widget → New posts**. Create four widgets with **no display position ticked**:

   | Widget key | Maximum entries | Forum limit |
   |---|---|---|
   | `ts_activity_all` | 12 | (none / all forums) |
   | `ts_activity_regions` | 12 | Season 5 (11), Campaign (56), Tangleweaves (12), Zalra (13), Hylands (15), Astorea (16), Falderen (17), Temeria (19), Lament (57), Misc (20), Real Life (21), Comms (22) |
   | `ts_activity_guildhall` | 12 | Trackers (6), DM Hub (9), Quest (8), LFGs (7), Apps (5), News (4) |
   | `ts_activity_community` | 12 | Services (26), Archive (25), OOC (52) |

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

  The icon list is in the `thumb` macro of `ts_activity_feed`, and the tints are at the bottom of `ts_activity_feed.less`.
- Any other forum gets a plain dark gradient tile.
