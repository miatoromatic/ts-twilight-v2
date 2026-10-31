# ts-twilight-v2

## Sidebar rail (XenForo 2.2.8)

| File | Goes to |
| --- | --- |
| `xenforo/templates/PAGE_CONTAINER.html` | ACP → Appearance → Templates → `PAGE_CONTAINER` (replace contents) |
| `xenforo/templates/ts_sidebar.less` | New template `ts_sidebar.less` in the same style |
| `xenforo/js/tsrp/sidebar/ts-sidebar.js` | Upload to `/js/tsrp/sidebar/ts-sidebar.js` on the server |

- Logo paths and nav icons are set at the top of the rail block in `PAGE_CONTAINER` (`$tsLogoFull`, `$tsLogoMark`, `$tsNavIcons`). An icon set on a nav entry in ACP → Setup → Public navigation overrides the map.
- The Linked Account template modification still matches (the include lands after the alerts menu, inside the tools cluster).
- Shortcut: `\` toggles the rail. Rail state is remembered per browser when docked (≥1100px).
