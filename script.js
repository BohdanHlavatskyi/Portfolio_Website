(() => {
	const qs = s => document.querySelector(s);
	const qsa = s => Array.from(document.querySelectorAll(s));

	const settingsToggle = qs('#settingsToggle');
	const settingsPanel = qs('#settingsPanel');
	const editMode = qs('#editMode');
	const themeSelect = qs('#themeSelect');
	const layoutSelect = qs('#layoutSelect');
	const saveBtn = qs('#saveBtn');
	const resetBtn = qs('#resetBtn');
	const projectsList = qs('#projectsList');
	const yearEl = qs('#year');

	const STORAGE_KEY = 'portfolio_state_v1';

	function assignIds() {
		qsa('[data-editable]').forEach((el, i) => {
			if (!el.dataset.id) el.dataset.id = `editable-${i}`;
		});
	}

	function setEditMode(on) {
		if (on) {
			document.body.classList.add('editing');
			qsa('[data-editable]').forEach(e => e.contentEditable = true);
			settingsPanel.setAttribute('aria-hidden', 'false');
		} else {
			document.body.classList.remove('editing');
			qsa('[data-editable]').forEach(e => e.contentEditable = false);
			settingsPanel.setAttribute('aria-hidden', 'false');
		}
	}

	function applyLayout(layout) {
		if (!projectsList) return;
		if (layout === 'list') projectsList.classList.add('list');
		else projectsList.classList.remove('list');
	}

	function applyTheme(theme) {
		document.documentElement.setAttribute('data-theme', theme || 'light');
	}

	function saveState() {
		const state = {
			theme: themeSelect.value,
			layout: layoutSelect.value,
			editables: {}
		};
		qsa('[data-editable]').forEach(el => state.editables[el.dataset.id] = el.innerHTML);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		saveBtn.textContent = 'Saved';
		setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
	}

	function loadState() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const state = JSON.parse(raw);
			if (state.theme) { themeSelect.value = state.theme; applyTheme(state.theme); }
			if (state.layout) { layoutSelect.value = state.layout; applyLayout(state.layout); }
			if (state.editables) {
				Object.entries(state.editables).forEach(([id, html]) => {
					const el = qsa(`[data-id="${id}"]`)[0] || qsa(`[data-id=${id}]`)[0] || document.querySelector(`[data-id='${id}']`);
					// fallback: find by dataset id
					let found = qsa('[data-editable]').find(e => e.dataset.id === id);
					if (found) found.innerHTML = html;
				});
			}
		} catch (e) { console.warn('Failed to load state', e); }
	}

	// wire events
	settingsToggle.addEventListener('click', () => {
		const hidden = settingsPanel.getAttribute('aria-hidden') === 'true';
		settingsPanel.setAttribute('aria-hidden', String(!hidden));
	});

	editMode.addEventListener('change', e => setEditMode(e.target.checked));
	themeSelect.addEventListener('change', e => applyTheme(e.target.value));
	layoutSelect.addEventListener('change', e => applyLayout(e.target.value));
	saveBtn.addEventListener('click', saveState);
	resetBtn.addEventListener('click', () => { localStorage.removeItem(STORAGE_KEY); location.reload(); });

	// init
	assignIds();
	loadState();
	yearEl.textContent = new Date().getFullYear();

})();
