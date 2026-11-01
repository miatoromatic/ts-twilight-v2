/*!
 * Terrasphere sidebar rail — XenForo 2.2.8
 * Upload to: /js/tsrp/sidebar/ts-sidebar.js (loaded at the end of PAGE_CONTAINER)
 *
 * - expand / collapse (remembered per browser, only when the rail is docked ≥1100px)
 * - accordions for nav entries with children (expanded rail)
 * - hover flyouts for nav entries with children (collapsed rail)
 * - tooltips for icon-only controls
 * - places XenForo menus (alerts, inbox, search, account…) beside the rail
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
	var mqMobile = window.matchMedia('(max-width: 650px)');
	var mqDocked = window.matchMedia('(min-width: 1100px)');

	function each(list, fn) {
		Array.prototype.forEach.call(list, fn);
	}
	function isMobile() {
		return mqMobile.matches;
	}
	function isExpanded() {
		return html.getAttribute('data-ts-rail') === 'expanded';
	}
	function isCollapsedDesktop() {
		return !isMobile() && !isExpanded();
	}
	function readStore() {
		try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
	}
	function writeStore(value) {
		try { window.localStorage.setItem(STORE_KEY, value); } catch (e) { /* private mode */ }
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
		setState(isExpanded() ? 'collapsed' : 'expanded', true);
	}

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
			if (isExpanded() && !mqDocked.matches && !isMobile()) {
				setState('collapsed', false);
			}
			return;
		}
		// "\" toggles the rail (like Perplexity's sidebar shortcut)
		if (e.key === '\\' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target) && !isMobile()) {
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
		each(scope.querySelectorAll('.ts-tools > .p-navgroup-link[title]:not([data-ts-tip])'), function (el) {
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
		if (isExpanded() && !always) {
			return;
		}
		// entries with children show their title in the flyout instead
		if (!isExpanded() && el.closest('.ts-navEl.has-children')) {
			return;
		}
		var text = el.getAttribute('data-ts-tip');
		if (!text) {
			return;
		}

		tipOwner = el;
		tip.textContent = text;
		var r = el.getBoundingClientRect();
		var below = isExpanded(); // expanded: icon rows are horizontal, so tip goes underneath
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

	// lets you confirm in the browser console which build is running: TSRail.version
	window.TSRail = { version: '2', expand: function () { setState('expanded', true); } };

	// late-loaded add-on icons inside the tools cluster
	if (window.MutationObserver) {
		var tools = rail.querySelector('.ts-tools');
		if (tools) {
			new MutationObserver(function () {
				adoptTitles(rail);
				each(rail.querySelectorAll(MENU_TRIGGER), menuFor);
			}).observe(tools, { childList: true });
		}
	}

	// enable transitions only after the first paint, so page loads don't animate
	window.requestAnimationFrame(function () {
		window.requestAnimationFrame(function () {
			html.classList.add('ts-rail-ready');
		});
	});
})(window, document);
