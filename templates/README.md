# Account / settings pages

One stylesheet styles all of the account pages:

| File | What it is |
|---|---|
| `public/ts_account.less` | Shared styles: side nav, cards, form rows, inputs, checkboxes, buttons, tabs, lists, profile hero, notification panel. |
| `public/account_details.html` | Rewritten `account_details` with a profile hero, email pill and row icons. |
| `public/account_preferences.html` | Rewritten `account_preferences` with row icons, group dividers and the two-column notification panel. |

## Install (XenForo 2.2.8)

1. **Appearance → Templates → Add template** in the TSRP3 Twilight v2 style. Choose type *Public* and name it `ts_account.less`. Paste in `public/ts_account.less`.
2. Open `account_wrapper` and add this as the first line:
   ```
   <xf:css src="ts_account.less" />
   ```
   Every page in the list below wraps `account_wrapper`, so this one line covers all of them, plus any other account pages such as Signature and Connected accounts.
   If you'd rather limit it to specific pages, put the same line at the top of each template. XF only loads the file once.
3. Replace `account_details` and `account_preferences` with the files here.

Pages covered: `account_alerts`, `account_reactions`, `account_bookmarks`,
`xc_linked_account_account_linked_account`, `account_details`,
`account_security`, `account_privacy`, `account_preferences`,
`account_following`, `account_ignored`.

## Hooks you can use in the other templates

- **Title tag**: `<xf:h1>{{ phrase('privacy') }} <span class="tsTag">{{ phrase('settings') }}</span></xf:h1>`
- **Row icon**: `rowclass="tsRow--icon tsRow--email"` on any `*row` tag. The ready-made icons are `--style`, `--language`, `--timezone`, `--content`, `--push`, `--email`, `--dob`, `--title` and `--about`. To add another, copy one rule in section 7 of the stylesheet.
- **Value pill**: `<span class="tsPill">…</span>`, or `tsPill tsPill--mono` for a monospace value.
- **Currency chips on the hero**: `dl.tsHero-stats > div.tsHero-stat.tsHero-stat--gold > dt + dd` (also `--mastery` and `--valor`).

## Tweaking

The colours, radii, label width and label case are the variables at the top of `ts_account.less`. Set `@tsa-labelTransform: uppercase;` for the all-caps label look.
`.p-body-inner { max-width: none; }` only takes effect on pages that load this file.
