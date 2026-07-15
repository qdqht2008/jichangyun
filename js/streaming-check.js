const services = [
  { key: 'chatgpt', probeUrl: 'https://chatgpt.com/favicon.ico' },
  { key: 'netflix', probeUrl: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico' },
  { key: 'claude', probeUrl: 'https://claude.ai/favicon.ico' },
  { key: 'tiktok', probeUrl: 'https://www.tiktok.com/favicon.ico' },
  { key: 'disney_plus', probeUrl: 'https://www.disneyplus.com/favicon.ico' },
  { key: 'hbo_max', probeUrl: 'https://www.hbomax.com/favicon.ico' },
];

const startButton = document.getElementById('streaming-start');
const errorElement = document.getElementById('streaming-error');
const networkIp = document.getElementById('network-ip');
const networkCountry = document.getElementById('network-country');
const networkTime = document.getElementById('network-time');

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function serviceCard(key) {
  return document.querySelector(`[data-service="${key}"]`);
}

function setCardState(key, state, detail) {
  const card = serviceCard(key);
  if (!card) return;
  card.classList.remove('is-running', 'is-supported', 'is-limited');
  card.classList.add(state === 'running' ? 'is-running' : state === 'supported' ? 'is-supported' : 'is-limited');
  card.querySelector('p').textContent = detail;
  card.querySelector('strong').textContent = state === 'running' ? '检测中' : state === 'supported' ? '基础可达' : '浏览器限制';
}

function regionDetail(regionSupport) {
  if (regionSupport === 'supported') return '常用出口地区参考：已收录支持';
  return '地区规则未收录，保持未知';
}

function probeResource(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(status);
    };
    const timer = setTimeout(() => finish('timeout'), timeoutMs);
    image.referrerPolicy = 'no-referrer';
    image.onload = () => finish('reachable');
    image.onerror = () => finish('limited');
    const target = new URL(url);
    target.searchParams.set('_check', Date.now().toString());
    image.src = target.href;
  });
}

async function loadNetwork() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('/api/streaming-check', {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`网络信息请求失败：HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('网络信息识别超时，请重新检测');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function renderNetwork(payload) {
  networkIp.textContent = payload.network.ip || '未由边缘环境提供';
  networkCountry.textContent = `${payload.network.country_name} · ${payload.network.country_code}`;
  networkTime.textContent = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(payload.checked_at));
}

async function runDetection() {
  startButton.disabled = true;
  startButton.querySelector('span').textContent = '检测中 0 / 6';
  errorElement.hidden = true;
  for (const service of services) setCardState(service.key, 'running', '正在识别地区并探测基础资源');

  try {
    const payload = await loadNetwork();
    renderNetwork(payload);
    let complete = 0;
    await Promise.all(services.map(async (service) => {
      const reachability = await probeResource(service.probeUrl);
      complete += 1;
      startButton.querySelector('span').textContent = `检测中 ${complete} / 6`;
      const region = regionDetail(payload.services?.[service.key]?.region_support);
      if (reachability === 'reachable') setCardState(service.key, 'supported', `${region}；公开基础资源可达`);
      else if (reachability === 'timeout') setCardState(service.key, 'limited', `${region}；资源探测超时`);
      else setCardState(service.key, 'limited', `${region}；浏览器或服务策略限制了资源探测`);
    }));
    startButton.querySelector('span').textContent = '重新检测';
  } catch (error) {
    networkIp.textContent = '识别失败';
    networkCountry.textContent = '—';
    networkTime.textContent = '—';
    for (const service of services) setCardState(service.key, 'limited', '网络信息识别失败，未完成本次检测');
    errorElement.hidden = false;
    errorElement.innerHTML = `<strong>网络信息识别失败</strong><p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>`;
    startButton.querySelector('span').textContent = '重新检测';
  } finally {
    startButton.disabled = false;
  }
}

startButton.addEventListener('click', runDetection);
