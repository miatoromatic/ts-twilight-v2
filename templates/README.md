# Forum list "What's new" activity feed (XenForo 2.2.8 Patch 1)

This adds a tabbed list of recent threads above the node list on `forum_list`. It is built on XenForo's own **New posts** widget (`XF:NewPosts`), so it handles permissions and unread state, and it adds no new queries beyond what the widget already runs.

## Files

| File | Where it goes |
|---|---|
| `forum_list.html` | Replace the contents of the **forum_list** template |
| `ts_activity_feed.html` | New public template named **ts_activity_feed** |
| `ts_activity_feed.less` | New public template named **ts_activity_feed.less** |

## Install

1. **Appearance → Templates → Add template**
   - Type: *Public*, Title: `ts_activity_feed`, paste `ts_activity_feed.html`.
   - Type: *Public*, Title: `ts_activity_feed.less`, paste `ts_activity_feed.less`.
2. **Appearance → Templates → `widget_new_posts`**, edited directly. Leave everything already in it as it is and only add lines at the top and bottom:
   - At the **very top**, before the first line, paste:
     ```
     <xf:if is="$style == 'ts_activity'">
     	<xf:macro template="ts_activity_feed" name="list" arg-threads="{$threads}" arg-link="{$link}" arg-hasMore="{$hasMore}" />
     <xf:else />
     ```
   - At the **very bottom**, after the last line, paste:
     ```
     </xf:if>
     ```
   This leaves every other New posts widget alone, including the What's New page. Only widgets rendered with `style="ts_activity"` use the new layout.
   (If you have a template modification system available, you can do the same thing there with a regex find of `#^.*$#s` and the wrap above around `$0`, which survives XenForo upgrades.)
3. Replace **forum_list** with `forum_list.html`.

## Configure

- **Tabs:** at the top of the feed block in `forum_list`, fill in the forum IDs for each tab:
  ```
  <xf:set var="$tsTabRegions" value="{{ [25, 26, 27] }}" />
  ```
  Use the IDs of the *forums* the threads are posted in, not category IDs. An empty `[]` means all forums.
- **Thumbnails:** each row's thumbnail has the class `.tsActivity-thumb--node{FORUM_ID}`. Uncomment and edit the examples at the bottom of `ts_activity_feed.less` to give each forum an image. A forum with no image gets a dark gradient.
- **Pills:** the thread prefix is shown first, followed by up to two thread tags. Prefix colours come from each prefix's CSS class (`label--red`, `label--green`, `label--blue`, and so on), recoloured as the dark tinted pills.
- **Row count:** change `limit="12"` on each `<xf:widget>`.
