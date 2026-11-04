# ts-twilight-v2

## Sidebar rail (XenForo 2.2.8)

| File | Goes to |
| --- | --- |
| `xenforo/templates/PAGE_CONTAINER.html` | ACP → Appearance → Templates → `PAGE_CONTAINER` (replace contents) |
| `xenforo/templates/ts_sidebar.less` | New template `ts_sidebar.less` in the same style |
| `xenforo/js/tsrp/sidebar/ts-sidebar.js` | Upload to `/js/tsrp/sidebar/ts-sidebar.js` on the server |
| `xenforo/templates/thread_view.html` | ACP → Appearance → Templates → `thread_view` (quick reply header + helper; reader options moved out) |
| `xenforo/templates/thread_view_extra.less` | Template `thread_view_extra.less` (new quick reply card, light-mode updates) |

- Logo paths and nav icons are set at the top of the rail block in `PAGE_CONTAINER` (`$tsLogoFull`, `$tsLogoMark`, `$tsNavIcons`). An icon set on a nav entry in ACP → Setup → Public navigation overrides the map.
- The Linked Account template modification still matches (the include lands after the alerts menu, inside the tools cluster).
- Shortcut: `\` toggles the rail. Rail state is remembered per browser when docked (≥1100px).
- The palette icon opens the Display menu: background theme, Sidebar / Top bar, and (on thread pages) Muted banner, Muted dialogue and Light mode. All choices are saved in the browser (`tsTheme`, `tsLayout`, `tsReaderPrefs`).
