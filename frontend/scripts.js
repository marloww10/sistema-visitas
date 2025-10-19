const API = 'http://localhost:4000/api';
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('userRole');
let currentOrder = { field: 'expectedAt', dir: 'ASC' };

function restoreSession() {
  console.log('Restaurando sessão... Token:', token, 'Role:', userRole);
  if (token && userRole) {
    document.getElementById('auth').hidden = true;
    document.getElementById('logoutBtn').hidden = false;
    if (userRole === 'resident') document.getElementById('resident').hidden = false;
    if (userRole === 'guard') document.getElementById('guard').hidden = false;
    if (userRole === 'admin') document.getElementById('admin').hidden = false;
    document.getElementById('loginMsg').innerText = `Bem-vindo de volta! (Role: ${userRole})`;
  }
}

async function login(e) {
  e.preventDefault();
  console.log('Tentando login...');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      userRole = data.user.role;
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userRole);
      console.log('Login bem-sucedido, token:', token);
      document.getElementById('loginMsg').innerText = `Bem-vindo ${data.user.name} (${userRole})`;
      document.getElementById('auth').hidden = true;
      document.getElementById('logoutBtn').hidden = false;
      if (userRole === 'resident') document.getElementById('resident').hidden = false;
      if (userRole === 'guard') document.getElementById('guard').hidden = false;
      if (userRole === 'admin') document.getElementById('admin').hidden = false;
    } else {
      console.error('Erro no login:', data);
      document.getElementById('loginMsg').innerText = data.error === 'Credenciais inválidas' ? 'Email ou senha incorretos' : data.error || JSON.stringify(data);
    }
  } catch (err) {
    console.error('Erro na requisição de login:', err);
    document.getElementById('loginMsg').innerText = 'Erro ao conectar com o servidor';
  }
}

function logout() {
  console.log('Fazendo logout...');
  token = null;
  userRole = null;
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  document.getElementById('auth').hidden = false;
  document.getElementById('resident').hidden = true;
  document.getElementById('guard').hidden = true;
  document.getElementById('admin').hidden = true;
  document.getElementById('logoutBtn').hidden = true;
  document.getElementById('loginMsg').innerText = 'Logout realizado. Faça login novamente.';
  document.getElementById('visitsList').innerHTML = '';
  document.getElementById('myVisitsList').innerHTML = '';
  document.getElementById('visitMsg').innerText = '';
  document.getElementById('registerMsg').innerText = '';
}

async function register(e) {
  e.preventDefault();
  console.log('Tentando cadastrar morador...');
  if (!token) {
    console.error('Token não encontrado. Faça login como admin primeiro.');
    document.getElementById('registerMsg').innerText = 'Faça login como administrador primeiro';
    return;
  }
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  const alameda = document.getElementById('regAlameda').value;
  const casa = document.getElementById('regCasa').value;
  const phone = document.getElementById('regPhone').value;

  console.log('Dados do formulário:', { name, email, password, role, alameda, casa, phone });

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name, email, password, role, alameda, casa, phone })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('Cadastro bem-sucedido:', data);
      document.getElementById('registerMsg').innerText = 'Morador cadastrado com sucesso';
    } else {
      console.error('Erro no cadastro:', data);
      const errorMsg = data.error.includes('unique constraint') ? 'Email já cadastrado' : data.error || JSON.stringify(data);
      document.getElementById('registerMsg').innerText = errorMsg;
    }
  } catch (err) {
    console.error('Erro na requisição de cadastro:', err);
    document.getElementById('registerMsg').innerText = 'Erro ao conectar com o servidor';
  }
}

async function createVisit(e) {
  e.preventDefault();
  console.log('Tentando cadastrar visita...');
  const visitorName = document.getElementById('visitorName').value;
  const type = document.getElementById('visitType').value;
  const expectedDate = document.getElementById('expectedDate').value;
  const expectedTime = document.getElementById('expectedTime').value;
  const note = document.getElementById('note').value;

  let expectedAt = null;
  if (expectedDate) {
    expectedAt = expectedDate;
    if (expectedTime) {
      expectedAt += `T${expectedTime}:00`;
    } else {
      expectedAt += 'T00:00:00';
    }
    expectedAt = new Date(expectedAt).toISOString();
  }

  try {
    const res = await fetch(`${API}/visits`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ visitorName, type, expectedAt, note })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('visitMsg').innerText = 'Visita cadastrada';
    } else {
      const errorMsg = data.error.includes('validation') ? 'Dados inválidos, verifique os campos' : data.error || JSON.stringify(data);
      document.getElementById('visitMsg').innerText = errorMsg;
    }
  } catch (err) {
    console.error('Erro na requisição de visita:', err);
    document.getElementById('visitMsg').innerText = 'Erro ao conectar com o servidor';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function mapStatus(status) {
  const statuses = {
    'scheduled': 'Agendada',
    'arrived': 'Chegou no condomínio',
    'left': 'Visita encerrada',
    'cancelled': 'Cancelada'
  };
  return statuses[status] || status;
}

function mapType(type) {
  const types = {
    'visita': 'Visita',
    'entrega_comida': 'Entrega de Comida',
    'entrega_encomenda': 'Entrega de Encomendas'
  };
  return types[type] || type;
}

async function loadVisits(url, listId = 'visitsList', isResident = false) {
  try {
    console.log('Carregando visitas de:', url);
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      const data = await res.json();
      console.error('Erro na resposta da API:', data);
      document.getElementById(isResident ? 'visitMsg' : listId).innerText = data.error || 'Erro ao carregar visitas';
      return;
    }
    const visits = await res.json();
    console.log('Visitas recebidas:', visits.length, visits);
    // Log detalhado para depurar o conteúdo de note
    visits.forEach(v => console.log(`Visita ID: ${v.id}, Note: ${v.note || 'Não disponível'}`));
    const list = document.getElementById(listId);
    list.innerHTML = '';
    if (visits.length === 0) {
      list.innerHTML = '<li class="visit-card"><div class="card-content">Nenhuma visita encontrada</div></li>';
      return;
    }
    visits.forEach(v => {
      const li = document.createElement('li');
      li.className = 'visit-card';
      li.innerHTML = `
        <div class="card-content">
          <div class="card-field"><span class="field-label">Visitante:</span> ${v.visitorName}</div>
          <div class="card-field"><span class="field-label">Tipo:</span> ${mapType(v.type)}</div>
          <div class="card-field"><span class="field-label">Alameda:</span> ${v.unit ? v.unit.alameda : '—'}</div>
          <div class="card-field"><span class="field-label">Casa:</span> ${v.unit ? v.unit.casa : '—'}</div>
          <div class="card-field"><span class="field-label">Telefone:</span> ${v.unit ? v.unit.phone : '—'}</div>
          <div class="card-field"><span class="field-label">Observação:</span> ${v.note ? v.note : '—'}</div>
          <div class="card-field"><span class="field-label">Esperado em:</span> ${formatDate(v.expectedAt)}</div>
          <div class="card-field"><span class="field-label">Status:</span> ${mapStatus(v.status)}</div>
          <div class="card-actions"></div>
        </div>
      `;
      const actionsDiv = li.querySelector('.card-actions');
      if (isResident && v.status === 'scheduled') {
        const btnCancel = document.createElement('button');
        btnCancel.innerText = 'Cancelar';
        btnCancel.className = 'action-btn cancel-btn';
        btnCancel.onclick = async () => {
          console.log('Cancelando visita ID:', v.id);
          await fetch(`${API}/visits/${v.id}/cancel`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
          loadVisits(url, listId, isResident);
        };
        actionsDiv.appendChild(btnCancel);
      } else if (!isResident) {
        const btnIn = document.createElement('button');
        btnIn.innerText = 'Check-in';
        btnIn.className = 'action-btn checkin-btn';
        btnIn.onclick = async () => {
          console.log('Fazendo check-in da visita ID:', v.id);
          await fetch(`${API}/visits/${v.id}/checkin`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
          loadVisits(url, listId, isResident);
        };
        const btnOut = document.createElement('button');
        btnOut.innerText = 'Check-out';
        btnOut.className = 'action-btn checkout-btn';
        btnOut.onclick = async () => {
          console.log('Fazendo check-out da visita ID:', v.id);
          await fetch(`${API}/visits/${v.id}/checkout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
          loadVisits(url, listId, isResident);
        };
        if (v.status === 'scheduled') actionsDiv.appendChild(btnIn);
        if (v.status === 'arrived') actionsDiv.appendChild(btnOut);
      }
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Erro ao carregar visitas:', err);
    document.getElementById(isResident ? 'visitMsg' : listId).innerText = 'Erro ao conectar com o servidor';
  }
}

async function loadToday() {
  let url = `${API}/visits/today?orderBy=${currentOrder.field}&orderDir=${currentOrder.dir}`;
  const search = document.getElementById('searchInput').value;
  const status = document.getElementById('statusFilter').value;
  const type = document.getElementById('typeFilter').value;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${status}`;
  if (type) url += `&type=${type}`;
  console.log('Carregando visitas de hoje com URL:', url);
  loadVisits(url, 'visitsList');
}

async function loadHistory() {
  let url = `${API}/visits/history?orderBy=${currentOrder.field}&orderDir=${currentOrder.dir}`;
  const search = document.getElementById('searchInput').value;
  const status = document.getElementById('statusFilter').value;
  const type = document.getElementById('typeFilter').value;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${status}`;
  if (type) url += `&type=${type}`;
  console.log('Carregando histórico com URL:', url);
  loadVisits(url, 'visitsList');
}

async function loadMyVisits() {
  console.log('Carregando visitas do morador...');
  loadVisits(`${API}/visits/my`, 'myVisitsList', true);
}

function toggleSort(field) {
  currentOrder.field = field;
  currentOrder.dir = currentOrder.dir === 'ASC' ? 'DESC' : 'ASC';
  document.getElementById('sortByDate').innerText = `Ordenar por Data (${currentOrder.field === 'expectedAt' ? currentOrder.dir : 'ASC'})`;
  document.getElementById('sortByName').innerText = `Ordenar por Nome (${currentOrder.field === 'visitorName' ? currentOrder.dir : 'ASC'})`;
  document.getElementById('sortByStatus').innerText = `Ordenar por Status (${currentOrder.field === 'status' ? currentOrder.dir : 'ASC'})`;
  loadToday();
}

async function exportReport() {
  try {
    console.log('Exportando relatório...');
    const res = await fetch(`${API}/visits/export`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      const data = await res.json();
      document.getElementById('registerMsg').innerText = data.error || 'Erro ao exportar relatório';
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visitas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao exportar relatório:', err);
    document.getElementById('registerMsg').innerText = 'Erro ao conectar com o servidor';
  }
}

document.getElementById('loginForm').addEventListener('submit', login);
document.getElementById('visitForm').addEventListener('submit', createVisit);
document.getElementById('loadToday').addEventListener('click', loadToday);
document.getElementById('loadHistory').addEventListener('click', loadHistory);
document.getElementById('loadMyVisits').addEventListener('click', loadMyVisits);
document.getElementById('registerForm').addEventListener('submit', register);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('applyFilters').addEventListener('click', loadToday);
document.getElementById('sortByDate').addEventListener('click', () => toggleSort('expectedAt'));
document.getElementById('sortByName').addEventListener('click', () => toggleSort('visitorName'));
document.getElementById('sortByStatus').addEventListener('click', () => toggleSort('status'));
document.getElementById('exportReport').addEventListener('click', exportReport);

restoreSession();