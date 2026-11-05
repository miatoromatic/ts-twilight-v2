# ts-twilight-v2

## Member tooltip: optional OOC line

`templates/member_tooltip.html` has a `[TS:ooc_line]` marker under the user title.
To show an "OOC" line there, replace that marker with the snippet below, with
`your_field_id` changed to the ID of the custom user field (ACP → Users →
Custom user fields). The styling is already in `member_tooltip.less`.

```html
<xf:if is="$user.Profile.custom_fields.your_field_id">
	<div class="tsTip-ooc">
		<span class="tsTip-oocTag">OOC</span>
		<span class="tsTip-oocName">{$user.Profile.custom_fields.your_field_id}</span>
	</div>
</xf:if>
```
