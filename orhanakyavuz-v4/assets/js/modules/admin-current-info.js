// assets/js/modules/admin-current-info.js
// ----------------------------------------------------------------------
// Güncel Bilgiler Yönetici Paneli Modülü.
// Ekleme, düzenleme, silme ve yayın durumunu değiştirme işlemleri.
// ----------------------------------------------------------------------

const ADMIN_API_BASE = (window.__API_BASE__ !== undefined)
  ? window.__API_BASE__
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

function adminHeaders(json = false) {
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function adminMessage(node, text, state = '') {
  if (!node) return;
  node.textContent = text;
  node.dataset.state = state;
}

export async function initAdminCurrentInfo() {
  const page = document.querySelector('[data-admin-current-page]');
  if (!page) return;

  const statusEl = page.querySelector('[data-admin-status]');
  const form = page.querySelector('[data-admin-form]');
  const listEl = page.querySelector('[data-admin-list]');
  const countEl = page.querySelector('[data-admin-count]');
  const resetBtn = page.querySelector('[data-admin-reset]');
  const sourceSelect = form.elements.sourceId;

  let currentItems = [];

  // Kaynakları yükle
  async function loadSources() {
    try {
      const res = await fetch(`${ADMIN_API_BASE}/api/admin/current-info/sources`, {
        credentials: 'include',
        headers: adminHeaders(),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error?.message || 'Kaynaklar alınamadı.');

      const sources = payload.data?.sources || [];
      sourceSelect.innerHTML = '<option value="">-- Resmî Kaynak Seçin --</option>';
      for (const s of sources) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.category})`;
        sourceSelect.appendChild(opt);
      }
    } catch (err) {
      adminMessage(statusEl, `Kaynak listesi yüklenemedi: ${err.message}`, 'error');
    }
  }

  // Listeyi yükle
  async function loadItems() {
    listEl.innerHTML = '<p>Kayıtlar yükleniyor...</p>';
    try {
      const res = await fetch(`${ADMIN_API_BASE}/api/admin/current-info`, {
        credentials: 'include',
        headers: adminHeaders(),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error?.message || 'İçerikler yüklenemedi.');

      currentItems = payload.data?.items || [];
      if (countEl) countEl.textContent = `${currentItems.length} kayıt`;

      renderList();
    } catch (err) {
      listEl.innerHTML = `<p class="error">Hata: ${err.message}</p>`;
      adminMessage(statusEl, err.message, 'error');
    }
  }

  function renderList() {
    listEl.replaceChildren();

    if (currentItems.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Henüz eklenmiş güncel bilgi bulunmuyor.';
      listEl.appendChild(empty);
      return;
    }

    for (const item of currentItems) {
      const card = document.createElement('article');
      card.className = 'admin-current-item';

      const top = document.createElement('div');
      top.className = 'admin-current-item__top';

      const title = document.createElement('h3');
      title.className = 'admin-current-item__title';
      title.textContent = item.title;

      const st = document.createElement('span');
      st.className = `admin-current-item__status admin-current-item__status--${item.status}`;
      st.textContent = item.status;

      top.append(title, st);

      const meta = document.createElement('p');
      meta.className = 'admin-current-item__meta';
      const d = item.publishDate ? new Date(item.publishDate).toLocaleDateString('tr-TR') : '-';
      meta.textContent = `${item.source?.name || 'Kaynak'} · ${item.category.toUpperCase()} · ${d}`;

      const actions = document.createElement('div');
      actions.className = 'admin-current-item__actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'button button--small button--outline';
      editBtn.textContent = 'Düzenle';
      editBtn.addEventListener('click', () => selectItem(item));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'button button--small button--danger';
      deleteBtn.textContent = 'Sil';
      deleteBtn.addEventListener('click', () => deleteItem(item.id));

      actions.append(editBtn, deleteBtn);
      card.append(top, meta, actions);
      listEl.appendChild(card);
    }
  }

  function selectItem(item) {
    form.elements.id.value = item.id;
    if (form.elements.sourceId) form.elements.sourceId.value = item.source?.id || '';
    if (form.elements.title) form.elements.title.value = item.title || '';
    if (form.elements.summary) form.elements.summary.value = item.summary || '';
    if (form.elements.originalUrl) form.elements.originalUrl.value = item.originalUrl || '';
    if (form.elements.category) form.elements.category.value = item.category || 'banka';
    if (form.elements.status) form.elements.status.value = item.status || 'published';
    if (form.elements.isFeatured) form.elements.isFeatured.checked = Boolean(item.isFeatured);

    if (form.elements.publishDate && item.publishDate) {
      try {
        const dt = new Date(item.publishDate);
        form.elements.publishDate.value = dt.toISOString().slice(0, 16);
      } catch {
        form.elements.publishDate.value = '';
      }
    }

    adminMessage(statusEl, `"${item.title}" düzenlenmek üzere seçildi.`);
    form.scrollIntoView({ behavior: 'smooth' });
  }

  function resetForm() {
    form.reset();
    form.elements.id.value = '';
    adminMessage(statusEl, '');
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetForm);
  }

  // Form gönderme (Ekleme / Güncelleme)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    adminMessage(statusEl, 'Kaydediliyor...');

    const formData = new FormData(form);
    const id = formData.get('id');
    const isEdit = Boolean(id);

    const payload = {
      sourceId: Number(formData.get('sourceId')),
      title: formData.get('title'),
      summary: formData.get('summary'),
      originalUrl: formData.get('originalUrl'),
      category: formData.get('category'),
      status: formData.get('status'),
      isFeatured: form.elements.isFeatured.checked,
      publishDate: formData.get('publishDate') ? new Date(formData.get('publishDate')).toISOString() : new Date().toISOString(),
    };

    try {
      const url = isEdit
        ? `${ADMIN_API_BASE}/api/admin/current-info/${id}`
        : `${ADMIN_API_BASE}/api/admin/current-info`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: adminHeaders(true),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'İşlem başarısız.');

      adminMessage(statusEl, isEdit ? 'Kayıt başarıyla güncellendi.' : 'Yeni duyuru başarıyla eklendi.', 'success');
      resetForm();
      await loadItems();
    } catch (err) {
      adminMessage(statusEl, `Kayıt başarısız: ${err.message}`, 'error');
    }
  });

  async function deleteItem(id) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;
    adminMessage(statusEl, 'Siliniyor...');

    try {
      const res = await fetch(`${ADMIN_API_BASE}/api/admin/current-info/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Silinemedi.');

      adminMessage(statusEl, 'Kayıt silindi.', 'success');
      await loadItems();
    } catch (err) {
      adminMessage(statusEl, `Silme hatası: ${err.message}`, 'error');
    }
  }

  await loadSources();
  await loadItems();
}
