# ts-twilight-v2

## Member tooltip: custom fields

`templates/member_tooltip.html` renders custom user fields under the user title
through `custom_fields_macros` → `custom_fields_view`, as chips. By default it
shows the same fields as posts: group **personal**, fields with
**Display in messages** enabled. To change which fields appear, edit the macro
call's arguments:

- `arg-group` — `personal`, `contact` or `preferences` (the field's "Field group")
- `arg-additionalFilters` — `{{ ['message'] }}` (Display in messages) or
  `{{ ['profile'] }}` (Display on profile pages)
- `arg-onlyInclude="{{ ['field_a', 'field_b'] }}"` — show only these field IDs
