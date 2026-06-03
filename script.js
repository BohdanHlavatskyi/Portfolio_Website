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
	const coverPhotoInput = qs('#coverPhotoInput');
	const removeCoverBtn = qs('#removeCoverBtn');
	const backgroundPhotoInput = qs('#backgroundPhotoInput');
	const removeBackgroundBtn = qs('#removeBackgroundBtn');
	const coverPhotoContainer = qs('#coverPhotoContainer');
	const siteHeader = qs('.site-header');

	// Project modal elements
	const projectModal = qs('#projectModal');
	const closeModal = qs('#closeModal');
	const projectForm = qs('#projectForm');
	const projectTitle = qs('#projectTitle');
	const projectDescription = qs('#projectDescription');
	const projectPhotos = qs('#projectPhotos');
	const projectPDF = qs('#projectPDF');
	const projectMedia = qs('#projectMedia');
	const deleteProjectBtn = qs('#deleteProjectBtn');
	const cancelProjectBtn = qs('#cancelProjectBtn');
	const addProjectBtn = qs('#addProjectBtn');
	const modalTitle = qs('#modalTitle');

	const STORAGE_KEY = 'portfolio_state_v1';
	const PROJECTS_KEY = 'portfolio_projects_v1';
	const COVER_PHOTO_KEY = 'portfolio_cover_photo_v1';
	const BACKGROUND_PHOTO_KEY = 'portfolio_background_photo_v1';

	let currentProjectId = null;
	let projects = [];

	function assignIds() {
		qsa('[data-editable]').forEach((el, i) => {
			if (!el.dataset.id) el.dataset.id = `editable-${i}`;
		});
	}

	function setEditMode(on) {
		if (on) {
			document.body.classList.add('editing');
			qsa('[data-editable]').forEach(e => e.contentEditable = true);
		} else {
			document.body.classList.remove('editing');
			qsa('[data-editable]').forEach(e => e.contentEditable = false);
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
		localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
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
					let found = qsa('[data-editable]').find(e => e.dataset.id === id);
					if (found) found.innerHTML = html;
				});
			}
		} catch (e) { console.warn('Failed to load state', e); }
	}

	function fileToBase64(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	async function handleCoverPhotoUpload(file) {
		if (!file) return;
		const base64 = await fileToBase64(file);
		localStorage.setItem(COVER_PHOTO_KEY, base64);
		displayCoverPhoto(base64);
		saveState();
	}

	function displayCoverPhoto(dataUrl) {
		if (dataUrl) {
			coverPhotoContainer.style.backgroundImage = `url('${dataUrl}')`;
			coverPhotoContainer.classList.add('active');
			siteHeader.classList.add('has-cover');
		} else {
			coverPhotoContainer.style.backgroundImage = '';
			coverPhotoContainer.classList.remove('active');
			siteHeader.classList.remove('has-cover');
		}
	}

	function removeCoverPhoto() {
		localStorage.removeItem(COVER_PHOTO_KEY);
		coverPhotoInput.value = '';
		displayCoverPhoto(null);
		saveState();
	}

	async function handleBackgroundPhotoUpload(file) {
		if (!file) return;
		const base64 = await fileToBase64(file);
		localStorage.setItem(BACKGROUND_PHOTO_KEY, base64);
		displayBackgroundPhoto(base64);
		saveState();
	}

	function displayBackgroundPhoto(dataUrl) {
		if (dataUrl) {
			document.documentElement.style.backgroundImage = `url('${dataUrl}')`;
			document.body.style.backgroundImage = `url('${dataUrl}')`;
			document.documentElement.style.backgroundColor = '';
			document.body.style.backgroundColor = '';
		} else {
			document.documentElement.style.backgroundImage = '';
			document.body.style.backgroundImage = '';
			document.documentElement.style.backgroundColor = '';
			document.body.style.backgroundColor = '';
		}
	}

	function removeBackgroundPhoto() {
		localStorage.removeItem(BACKGROUND_PHOTO_KEY);
		backgroundPhotoInput.value = '';
		displayBackgroundPhoto(null);
		saveState();
	}

	function loadCoverPhoto() {
		try {
			const coverPhoto = localStorage.getItem(COVER_PHOTO_KEY);
			if (coverPhoto) {
				displayCoverPhoto(coverPhoto);
			}
		} catch (e) { console.warn('Failed to load cover photo', e); }
	}

	function loadProjects() {
		try {
			const raw = localStorage.getItem(PROJECTS_KEY);
			if (raw) projects = JSON.parse(raw);
			renderProjects();
		} catch (e) { console.warn('Failed to load projects', e); }
	}

	function loadBackgroundPhoto() {
		try {
			const backgroundPhoto = localStorage.getItem(BACKGROUND_PHOTO_KEY);
			if (backgroundPhoto) displayBackgroundPhoto(backgroundPhoto);
		} catch (e) { console.warn('Failed to load background photo', e); }
	}

	function renderProjects() {
		projectsList.innerHTML = '';
		projects.forEach((project, idx) => {
			const card = document.createElement('article');
			card.className = 'project-card';
			card.dataset.projectId = idx;

			const header = document.createElement('div');
			header.className = 'project-header';

			const title = document.createElement('h4');
			title.className = 'project-title';
			title.textContent = project.title || 'Untitled Project';

			const editBtn = document.createElement('button');
			editBtn.className = 'project-edit-btn';
			editBtn.type = 'button';
			editBtn.textContent = '✎';
			editBtn.setAttribute('aria-label', 'Edit project');
			editBtn.addEventListener('click', () => openProjectModal(idx));

			header.appendChild(title);
			header.appendChild(editBtn);

			const description = document.createElement('p');
			description.className = 'project-description';
			description.textContent = project.description || '';

			const media = document.createElement('div');
			media.className = 'project-media';

			// Add photos
			if (project.photos && project.photos.length > 0) {
				project.photos.forEach(photo => {
					const img = document.createElement('img');
					img.src = photo;
					img.alt = 'Project photo';
					media.appendChild(img);
				});
			}

			// Add PDF link
			if (project.pdf) {
				const pdfLink = document.createElement('a');
				pdfLink.href = project.pdf;
				pdfLink.textContent = '📄 View PDF';
				pdfLink.download = `${project.title || 'document'}.pdf`;
				media.appendChild(pdfLink);
			}

			card.appendChild(header);
			card.appendChild(description);
			card.appendChild(media);
			projectsList.appendChild(card);
		});
	}

	function openProjectModal(projectId) {
		currentProjectId = projectId;
		const project = projects[projectId];

		if (project) {
			modalTitle.textContent = 'Edit Project';
			projectTitle.value = project.title || '';
			projectDescription.value = project.description || '';
			deleteProjectBtn.style.display = 'block';
		} else {
			modalTitle.textContent = 'Create New Project';
			projectTitle.value = '';
			projectDescription.value = '';
			deleteProjectBtn.style.display = 'none';
		}

		projectPhotos.value = '';
		projectPDF.value = '';
		renderMediaPreview(project);

		projectModal.setAttribute('aria-hidden', 'false');
	}

	function renderMediaPreview(project) {
		projectMedia.innerHTML = '';

		if (!project) return;

		// Photos
		if (project.photos && project.photos.length > 0) {
			const photosContainer = document.createElement('div');
			photosContainer.innerHTML = '<strong>Photos:</strong>';
			projectMedia.appendChild(photosContainer);

			project.photos.forEach((photo, idx) => {
				const item = document.createElement('div');
				item.className = 'media-preview-item';

				const img = document.createElement('img');
				img.src = photo;
				img.alt = 'Preview';

				const removeBtn = document.createElement('button');
				removeBtn.className = 'media-preview-item-remove';
				removeBtn.type = 'button';
				removeBtn.textContent = '✕';
				removeBtn.addEventListener('click', () => {
					project.photos.splice(idx, 1);
					renderMediaPreview(project);
				});

				item.appendChild(img);
				item.appendChild(removeBtn);
				projectMedia.appendChild(item);
			});
		}

		// PDF
		if (project.pdf) {
			const pdfItem = document.createElement('div');
			pdfItem.className = 'media-preview-item';
			pdfItem.innerHTML = '<strong>📄 PDF Attached</strong>';

			const removeBtn = document.createElement('button');
			removeBtn.className = 'media-preview-item-remove';
			removeBtn.type = 'button';
			removeBtn.textContent = '✕';
			removeBtn.addEventListener('click', () => {
				project.pdf = null;
				renderMediaPreview(project);
			});

			pdfItem.appendChild(removeBtn);
			projectMedia.appendChild(pdfItem);
		}
	}

	async function saveProject() {
		const title = projectTitle.value.trim();
		if (!title) {
			alert('Please enter a project title');
			return;
		}

		let project = projects[currentProjectId];
		if (!project) {
			project = { title: '', description: '', photos: [], pdf: null };
			projects.push(project);
		}

		project.title = title;
		project.description = projectDescription.value;

		// Handle new photos
		if (projectPhotos.files.length > 0) {
			if (!project.photos) project.photos = [];
			for (const file of projectPhotos.files) {
				const base64 = await fileToBase64(file);
				project.photos.push(base64);
			}
		}

		// Handle new PDF
		if (projectPDF.files.length > 0) {
			const base64 = await fileToBase64(projectPDF.files[0]);
			project.pdf = base64;
		}

		closeProjectModal();
		renderProjects();
		saveState();
	}

	function deleteProject() {
		if (currentProjectId !== null && projects[currentProjectId]) {
			if (confirm('Are you sure you want to delete this project?')) {
				projects.splice(currentProjectId, 1);
				closeProjectModal();
				renderProjects();
				saveState();
			}
		}
	}

	function closeProjectModal() {
		projectModal.setAttribute('aria-hidden', 'true');
		currentProjectId = null;
		projectForm.reset();
		projectMedia.innerHTML = '';
	}

	// Event listeners
	settingsToggle.addEventListener('click', () => {
		const hidden = settingsPanel.getAttribute('aria-hidden') === 'true';
		settingsPanel.setAttribute('aria-hidden', String(!hidden));
	});

	coverPhotoInput.addEventListener('change', e => {
		if (e.target.files.length > 0) {
			handleCoverPhotoUpload(e.target.files[0]);
		}
	});

	backgroundPhotoInput.addEventListener('change', e => {
		if (e.target.files.length > 0) {
			handleBackgroundPhotoUpload(e.target.files[0]);
		}
	});

	removeCoverBtn.addEventListener('click', removeCoverPhoto);
	removeBackgroundBtn.addEventListener('click', removeBackgroundPhoto);

	editMode.addEventListener('change', e => setEditMode(e.target.checked));
	themeSelect.addEventListener('change', e => applyTheme(e.target.value));
	layoutSelect.addEventListener('change', e => applyLayout(e.target.value));
	saveBtn.addEventListener('click', saveState);
	resetBtn.addEventListener('click', () => {
		if (confirm('Reset all content and projects?')) {
			localStorage.removeItem(STORAGE_KEY);
			localStorage.removeItem(PROJECTS_KEY);
			localStorage.removeItem(COVER_PHOTO_KEY);
			localStorage.removeItem(BACKGROUND_PHOTO_KEY);
			location.reload();
		}
	});

	projectForm.addEventListener('submit', e => {
		e.preventDefault();
		saveProject();
	});

	closeModal.addEventListener('click', closeProjectModal);
	cancelProjectBtn.addEventListener('click', closeProjectModal);
	deleteProjectBtn.addEventListener('click', deleteProject);
	addProjectBtn.addEventListener('click', () => {
		currentProjectId = projects.length; // Next index
		openProjectModal(currentProjectId);
	});

	// Close modal on outside click
	projectModal.addEventListener('click', e => {
		if (e.target === projectModal) closeProjectModal();
	});

	// Init
	assignIds();
	loadState();
	loadProjects();
	loadCoverPhoto();
	loadBackgroundPhoto();
	yearEl.textContent = new Date().getFullYear();

	// Generate QR codes
	function generateQRCodes() {
		const githubUrl = 'https://github.com/BohdanHlavatskyi';
		const linkedinUrl = 'https://www.linkedin.com/in/bohdan-hlavatskyi-531248279/';

		const githubQRContainer = qs('#qr-github');
		const linkedinQRContainer = qs('#qr-linkedin');

		// Clear existing QR codes
		githubQRContainer.innerHTML = '';
		linkedinQRContainer.innerHTML = '';

		// Generate GitHub QR code
		if (githubQRContainer && typeof QRCode !== 'undefined') {
			new QRCode(githubQRContainer, {
				text: githubUrl,
				width: 140,
				height: 140,
				colorDark: '#000000',
				colorLight: '#ffffff',
				correctLevel: QRCode.CorrectLevel.H
			});
		}

		// Generate LinkedIn QR code
		if (linkedinQRContainer && typeof QRCode !== 'undefined') {
			new QRCode(linkedinQRContainer, {
				text: linkedinUrl,
				width: 140,
				height: 140,
				colorDark: '#000000',
				colorLight: '#ffffff',
				correctLevel: QRCode.CorrectLevel.H
			});
		}
	}

	// Generate QR codes after a small delay to ensure QRCode library is loaded
	setTimeout(generateQRCodes, 100);

})();
