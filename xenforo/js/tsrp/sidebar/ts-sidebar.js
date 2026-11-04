/*!
 * Terrasphere sidebar rail — XenForo 2.2.8
 * Upload to: /js/tsrp/sidebar/ts-sidebar.js (loaded at the end of PAGE_CONTAINER)
 *
 * - expand / collapse (remembered per browser, only when the rail is docked ≥1100px)
 * - accordions for nav entries with children (expanded rail)
 * - hover flyouts for nav entries with children (collapsed rail)
 * - tooltips for icon-only controls
 * - places XenForo menus (alerts, inbox, search, account…) beside the rail
 * - Display menu: sidebar / top bar layout, background theme, thread reading prefs
 *
 * Runs before XenForo's own init (plain script at the end of <body>), which lets it
 * tag each rail menu while it is still next to its trigger.
 */
(function (window, document) {
	'use strict';

	var html = document.documentElement;
	var rail = document.querySelector('.ts-rail');
	if (!rail) {
		return;
	}

	var STORE_KEY = 'tsRail';
	var LAYOUT_KEY = 'tsLayout';
	var mqMobile = window.matchMedia('(max-width: 650px)');
	var mqDocked = window.matchMedia('(min-width: 1100px)');

	function each(list, fn) {
		Array.prototype.forEach.call(list, fn);
	}
	function isMobile() {
		return mqMobile.matches;
	}
	// top bar = the user chose the top-of-page layout, or the screen is phone-sized
	function isTopChosen() {
		return html.getAttribute('data-ts-layout') === 'top';
	}
	function isTopBar() {
		return isMobile() || isTopChosen();
	}
	function isExpanded() {
		return html.getAttribute('data-ts-rail') === 'expanded';
	}
	function isCollapsedDesktop() {
		return !isTopBar() && !isExpanded();
	}
	function readStore(key) {
		try { return window.localStorage.getItem(key || STORE_KEY); } catch (e) { return null; }
	}
	function writeStore(value, key) {
		try { window.localStorage.setItem(key || STORE_KEY, value); } catch (e) { /* private mode */ }
	}
	function removeStore(key) {
		try { window.localStorage.removeItem(key); } catch (e) { /* private mode */ }
	}

	/* ------------------------------------------------------------------
	   Expand / collapse
	   ------------------------------------------------------------------ */

	var toggles = rail.querySelectorAll('.js-tsRailToggle');

	function syncToggles() {
		var expanded = isExpanded();
		var label = expanded ? 'Collapse sidebar' : 'Expand sidebar';
		each(toggles, function (btn) {
			btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			btn.setAttribute('aria-label', label);
			btn.setAttribute('data-ts-tip', label);
		});
	}

	function setState(value, persist) {
		html.setAttribute('data-ts-rail', value);
		syncToggles();
		closeFlyouts();
		hideTip();
		// only the docked layout is a real preference; the 651–1099 overlay is transient
		if (persist && mqDocked.matches) {
			writeStore(value);
		}
	}

	function toggleRail() {
		if (isTopChosen()) {
			return;
		}
		setState(isExpanded() ? 'collapsed' : 'expanded', true);
	}

	/* ------------------------------------------------------------------
	   Display menu: layout, background theme, thread reading prefs.
	   Everything is remembered per browser; the <head> script in PAGE_CONTAINER
	   re-applies it before first paint. Keep THEMES / READER_CLASSES in step with it.
	   ------------------------------------------------------------------ */

	var THEME_KEY = 'tsTheme';
	var READER_KEY = 'tsReaderPrefs';
	var THEMES = ['twilight', 'twilight-lt', 'classic', 'dawn', 'dawn-lt'];
	var READER_CLASSES = {
		banner: 'ts-plain-banner',
		dialogue: 'ts-plain-dialogue',
		light: 'ts-light-mode'
	};

	// an open menu (e.g. the Display menu itself) follows the bar when the layout changes
	function replaceActiveMenus() {
		window.requestAnimationFrame(function () {
			each(document.querySelectorAll('.ts-railMenu.is-active'), function (menu) {
				if (menu.__tsTrigger) {
					placeMenu(menu, menu.__tsTrigger);
				}
			});
		});
	}

	function setLayout(layout, persist) {
		var top = layout === 'top';
		html.setAttribute('data-ts-layout', top ? 'top' : 'rail');
		if (persist !== false) {
			writeStore(top ? 'top' : 'rail', LAYOUT_KEY);
		}

		// the top bar always uses the collapsed rail markup; going back restores the docked preference
		var railState = 'collapsed';
		if (!top && mqDocked.matches) {
			railState = readStore() === 'collapsed' ? 'collapsed' : 'expanded';
		}
		setState(railState, false);
		syncDisplayMenu();
		replaceActiveMenus();
	}

	function currentTheme() {
		var theme = html.getAttribute('data-ts-theme');
		return THEMES.indexOf(theme) > -1 ? theme : '';
	}

	function setTheme(theme, persist) {
		if (THEMES.indexOf(theme) > -1) {
			html.setAttribute('data-ts-theme', theme);
			if (persist !== false) {
				writeStore(theme, THEME_KEY);
			}
		} else {
			html.removeAttribute('data-ts-theme');
			if (persist !== false) {
				removeStore(THEME_KEY);
			}
		}
		syncDisplayMenu();
	}

	function readReaderPrefs() {
		try {
			return JSON.parse(readStore(READER_KEY) || '{}') || {};
		} catch (e) {
			return {};
		}
	}

	function applyReaderPrefs(prefs) {
		Object.keys(READER_CLASSES).forEach(function (key) {
			html.classList.toggle(READER_CLASSES[key], !!prefs[key]);
		});
	}

	function setReaderPref(key, on) {
		if (!READER_CLASSES[key]) {
			return;
		}
		var prefs = readReaderPrefs();
		if (on) {
			prefs[key] = 1;
		} else {
			delete prefs[key];
		}
		delete prefs.background; // "Muted background" is now the Twilight LT theme
		writeStore(JSON.stringify(prefs), READER_KEY);
		html.classList.toggle(READER_CLASSES[key], !!on);
		syncDisplayMenu();
	}

	function syncDisplayMenu() {
		var theme = currentTheme();
		var layout = isTopChosen() ? 'top' : 'rail';
		each(document.querySelectorAll('[data-ts-theme-set]'), function (btn) {
			btn.setAttribute('aria-pressed', btn.getAttribute('data-ts-theme-set') === theme ? 'true' : 'false');
		});
		each(document.querySelectorAll('[data-ts-layout-set]'), function (btn) {
			btn.setAttribute('aria-pressed', btn.getAttribute('data-ts-layout-set') === layout ? 'true' : 'false');
		});
		each(document.querySelectorAll('.js-tsThemeReset'), function (btn) {
			btn.disabled = !theme;
		});
		each(document.querySelectorAll('.js-tsReaderPref'), function (box) {
			var cls = READER_CLASSES[box.getAttribute('data-pref')];
			if (cls) {
				box.checked = html.classList.contains(cls);
			}
		});
	}

	document.addEventListener('click', function (e) {
		var btn = e.target.closest && e.target.closest('[data-ts-theme-set], [data-ts-layout-set], .js-tsThemeReset');
		if (!btn) {
			return;
		}
		e.preventDefault();
		if (btn.hasAttribute('data-ts-theme-set')) {
			setTheme(btn.getAttribute('data-ts-theme-set'));
		} else if (btn.hasAttribute('data-ts-layout-set')) {
			setLayout(btn.getAttribute('data-ts-layout-set'));
		} else {
			setTheme('');
		}
	});

	document.addEventListener('change', function (e) {
		var box = e.target.closest && e.target.closest('.js-tsReaderPref');
		if (box) {
			setReaderPref(box.getAttribute('data-pref'), box.checked);
		}
	});

	// keep other open tabs in step
	window.addEventListener('storage', function (e) {
		if (e.key === THEME_KEY) {
			setTheme(e.newValue || '', false);
		} else if (e.key === LAYOUT_KEY) {
			setLayout(e.newValue === 'top' ? 'top' : 'rail', false);
		} else if (e.key === READER_KEY) {
			applyReaderPrefs(readReaderPrefs());
			syncDisplayMenu();
		}
	});

	each(toggles, function (btn) {
		btn.addEventListener('click', function (e) {
			e.preventDefault();
			toggleRail();
		});
	});

	// clicking empty space on the collapsed rail expands it.
	// Window-level capture, so no other script's stopPropagation() can swallow the click.
	var INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [data-xf-click], .menu, .ts-sub';
	window.addEventListener('click', function (e) {
		var target = e.target;
		if (!target || !target.closest || !rail.contains(target) || !isCollapsedDesktop()) {
			return;
		}
		if (target.closest(INTERACTIVE)) {
			return;
		}
		setState('expanded', true);
	}, true);

	var backdrop = document.querySelector('.js-tsRailBackdrop');
	if (backdrop) {
		backdrop.addEventListener('click', function () {
			setState('collapsed', false);
		});
	}

	function onDockedChange() {
		if (isTopChosen()) {
			return;
		}
		if (mqDocked.matches) {
			var stored = readStore();
			setState(stored === 'collapsed' ? 'collapsed' : 'expanded', false);
		} else if (isExpanded()) {
			setState('collapsed', false);
		}
	}
	if (mqDocked.addEventListener) {
		mqDocked.addEventListener('change', onDockedChange);
	} else if (mqDocked.addListener) {
		mqDocked.addListener(onDockedChange);
	}

	function isTyping(target) {
		if (!target) {
			return false;
		}
		var tag = target.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
	}

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			closeFlyouts();
			// close the overlay rail on mid-width screens
			if (isExpanded() && !mqDocked.matches && !isTopBar()) {
				setState('collapsed', false);
			}
			return;
		}
		// "\" toggles the rail (like Perplexity's sidebar shortcut)
		if (e.key === '\\' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target) && !isTopBar()) {
			e.preventDefault();
			toggleRail();
		}
	});

	/* ------------------------------------------------------------------
	   Accordions (expanded) + click-to-expand (collapsed)
	   ------------------------------------------------------------------ */

	function setOpen(navEl, open) {
		navEl.classList.toggle('is-open', open);
		each(navEl.querySelectorAll(':scope > .ts-navRow .js-tsNavToggle'), function (t) {
			t.setAttribute('aria-expanded', open ? 'true' : 'false');
		});
	}

	function activateNavToggle(trigger) {
		var navEl = trigger.closest('.ts-navEl');
		if (!navEl) {
			return;
		}
		if (isCollapsedDesktop()) {
			setState('expanded', true);
			setOpen(navEl, true);
			return;
		}
		setOpen(navEl, !navEl.classList.contains('is-open'));
	}

	rail.addEventListener('click', function (e) {
		var trigger = e.target.closest('.js-tsNavToggle');
		if (trigger && rail.contains(trigger)) {
			e.preventDefault();
			activateNavToggle(trigger);
		}
	});
	rail.addEventListener('keydown', function (e) {
		if (e.key !== 'Enter' && e.key !== ' ') {
			return;
		}
		var trigger = e.target.closest('span.js-tsNavToggle');
		if (trigger) {
			e.preventDefault();
			activateNavToggle(trigger);
		}
	});

	/* ------------------------------------------------------------------
	   Collapsed flyouts for entries with children
	   ------------------------------------------------------------------ */

	var flyTimer = null;

	function closeFlyouts(except) {
		each(rail.querySelectorAll('.ts-navEl.is-flyout'), function (el) {
			if (el !== except) {
				el.classList.remove('is-flyout');
			}
		});
	}

	function openFlyout(navEl) {
		if (!isCollapsedDesktop()) {
			return;
		}
		var sub = navEl.querySelector('.ts-sub');
		if (!sub) {
			return;
		}
		window.clearTimeout(flyTimer);
		closeFlyouts(navEl);
		hideTip();

		var row = navEl.querySelector('.ts-navRow') || navEl;
		var rect = row.getBoundingClientRect();
		sub.style.setProperty('--ts-fly-top', Math.max(8, rect.top - 6) + 'px');
		navEl.classList.add('is-flyout');

		// keep the panel inside the viewport
		var height = sub.offsetHeight;
		var maxTop = window.innerHeight - height - 8;
		if (rect.top - 6 > maxTop) {
			sub.style.setProperty('--ts-fly-top', Math.max(8, maxTop) + 'px');
		}
	}

	function scheduleClose(navEl) {
		window.clearTimeout(flyTimer);
		flyTimer = window.setTimeout(function () {
			navEl.classList.remove('is-flyout');
		}, 140);
	}

	each(rail.querySelectorAll('.ts-navEl.has-children'), function (navEl) {
		navEl.addEventListener('mouseenter', function () { openFlyout(navEl); });
		navEl.addEventListener('mouseleave', function () { scheduleClose(navEl); });
		navEl.addEventListener('focusin', function () { openFlyout(navEl); });
		navEl.addEventListener('focusout', function (e) {
			if (!navEl.contains(e.relatedTarget)) {
				scheduleClose(navEl);
			}
		});
	});

	var navWrap = rail.querySelector('.ts-navWrap');
	if (navWrap) {
		navWrap.addEventListener('scroll', function () { closeFlyouts(); hideTip(); }, { passive: true });
	}

	/* ------------------------------------------------------------------
	   Tooltips
	   ------------------------------------------------------------------ */

	var tip = document.createElement('div');
	tip.className = 'ts-tip';
	tip.setAttribute('role', 'tooltip');
	tip.setAttribute('aria-hidden', 'true');
	document.body.appendChild(tip);

	var tipOwner = null;

	// adopt add-on icons (e.g. linked accounts) that only have a title=""
	function adoptTitles(scope) {
		each(scope.querySelectorAll('.ts-tools > .p-navgroup-link[title]:not([data-ts-tip]), .ts-extraTools > .p-navgroup-link[title]:not([data-ts-tip])'), function (el) {
			el.setAttribute('data-ts-tip', el.getAttribute('title'));
			el.setAttribute('data-ts-tip-always', '');
			if (!el.hasAttribute('aria-label')) {
				el.setAttribute('aria-label', el.getAttribute('title'));
			}
			el.removeAttribute('title');
		});
	}
	adoptTitles(rail);

	function showTip(el) {
		if (isMobile() || el.classList.contains('is-menuOpen')) {
			return;
		}
		var always = el.hasAttribute('data-ts-tip-always');
		var top = isTopChosen();
		if (!top && isExpanded() && !always) {
			return;
		}
		// entries with children show their title in the flyout instead
		if (!top && !isExpanded() && el.closest('.ts-navEl.has-children')) {
			return;
		}
		var text = el.getAttribute('data-ts-tip');
		if (!text) {
			return;
		}

		tipOwner = el;
		tip.textContent = text;
		var r = el.getBoundingClientRect();
		var below = top || isExpanded(); // horizontal icon rows: tip goes underneath
		tip.classList.toggle('ts-tip--below', below);
		tip.style.left = '0px';
		tip.style.top = '0px';

		var w = tip.offsetWidth;
		var h = tip.offsetHeight;
		var left, top;
		if (below) {
			left = r.left + r.width / 2 - w / 2;
			top = r.bottom + 8;
		} else {
			left = r.right + 10;
			top = r.top + r.height / 2 - h / 2;
		}
		left = Math.max(6, Math.min(left, window.innerWidth - w - 6));
		top = Math.max(6, Math.min(top, window.innerHeight - h - 6));
		tip.style.left = Math.round(left) + 'px';
		tip.style.top = Math.round(top) + 'px';
		tip.classList.add('is-visible');
	}

	function hideTip() {
		tipOwner = null;
		tip.classList.remove('is-visible');
	}

	rail.addEventListener('mouseover', function (e) {
		var el = e.target.closest('[data-ts-tip]');
		if (el && el !== tipOwner && rail.contains(el)) {
			showTip(el);
		}
	});
	rail.addEventListener('mouseout', function (e) {
		if (tipOwner && !tipOwner.contains(e.relatedTarget)) {
			hideTip();
		}
	});
	rail.addEventListener('focusin', function (e) {
		var el = e.target.closest('[data-ts-tip]');
		if (el && e.target.matches(':focus-visible')) {
			showTip(el);
		}
	});
	rail.addEventListener('focusout', hideTip);
	rail.addEventListener('mousedown', hideTip);

	/* ------------------------------------------------------------------
	   XenForo menus opened from the rail
	   ------------------------------------------------------------------ */

	var MENU_TRIGGER = '[data-xf-click~="menu"]';

	function menuFor(trigger) {
		if (trigger.__tsMenu) {
			return trigger.__tsMenu;
		}
		var node = trigger.nextElementSibling;
		while (node && !node.hasAttribute('data-menu')) {
			node = node.nextElementSibling;
		}
		if (node) {
			trigger.__tsMenu = node;
			node.__tsTrigger = trigger;
			node.classList.add('ts-railMenu');
		}
		return node;
	}

	function placeMenu(menu, trigger) {
		var style = menu.style;
		if (isMobile()) {
			menu.setAttribute('data-ts-place', 'mobile');
			style.setProperty('--ts-mt', Math.round(rail.getBoundingClientRect().bottom + 6) + 'px');
			return;
		}
		var railRect = rail.getBoundingClientRect();
		var r = trigger.getBoundingClientRect();

		if (isTopChosen()) {
			// desktop top bar: drop down under the icon, right-aligned to it
			menu.setAttribute('data-ts-place', 'below');
			style.setProperty('--ts-mt', Math.round(railRect.bottom + 6) + 'px');
			style.setProperty('--ts-mr', Math.round(Math.max(8, window.innerWidth - r.right)) + 'px');
			return;
		}

		style.setProperty('--ts-ml', Math.round(railRect.right + 8) + 'px');

		if (r.top + r.height / 2 > window.innerHeight * 0.55) {
			// lower half (account, staff): grow upward from the trigger
			menu.setAttribute('data-ts-place', 'bottom');
			style.setProperty('--ts-mb', Math.round(Math.max(8, window.innerHeight - r.bottom)) + 'px');
		} else {
			menu.setAttribute('data-ts-place', 'top');
			style.setProperty('--ts-mt', Math.round(Math.max(8, r.top)) + 'px');
		}
	}

	// tag every rail menu now, before XenForo initialises them
	each(rail.querySelectorAll(MENU_TRIGGER), menuFor);

	// capture phase: runs before XenForo's delegated click handler opens the menu
	document.addEventListener('click', function (e) {
		var trigger = e.target.closest(MENU_TRIGGER);
		if (!trigger || !rail.contains(trigger)) {
			return;
		}
		hideTip();
		var menu = menuFor(trigger);
		if (menu) {
			placeMenu(menu, trigger);
		}
	}, true);

	// keyboard shortcuts (alt+m, etc.) open menus without a click
	if (window.jQuery) {
		window.jQuery(document).on('menu:open menu:opened', '.ts-railMenu', function () {
			if (this.__tsTrigger) {
				placeMenu(this, this.__tsTrigger);
			}
		});
	}

	window.addEventListener('resize', function () {
		hideTip();
		closeFlyouts();
		each(document.querySelectorAll('.ts-railMenu.is-active'), function (menu) {
			if (menu.__tsTrigger) {
				placeMenu(menu, menu.__tsTrigger);
			}
		});
	});

	/* ------------------------------------------------------------------
	   Boot
	   ------------------------------------------------------------------ */

	syncToggles();
	syncDisplayMenu();

	// lets you confirm in the browser console which build is running: TSRail.version
	window.TSRail = {
		version: '4',
		expand: function () { setState('expanded', true); },
		setLayout: setLayout,
		setTheme: setTheme
	};

	// late-loaded add-on icons (tools cluster, or the linked-accounts slot above the avatar)
	if (window.MutationObserver) {
		each(rail.querySelectorAll('.ts-tools, .ts-extraTools'), function (group) {
			new MutationObserver(function () {
				adoptTitles(rail);
				each(rail.querySelectorAll(MENU_TRIGGER), menuFor);
			}).observe(group, { childList: true });
		});
	}

	// enable transitions only after the first paint, so page loads don't animate
	window.requestAnimationFrame(function () {
		window.requestAnimationFrame(function () {
			html.classList.add('ts-rail-ready');
		});
	});
})(window, document);
