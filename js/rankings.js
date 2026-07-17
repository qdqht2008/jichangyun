import {
  calculateScore,
  filterAirports,
  formatPrice,
  loadAirportRecords,
  riskLabel,
  sortAirports,
  uniqueCapabilities,
} from './airport-data.mjs';

const elements = {
  query: document.getElementById('ranking-query'),
  risk: document.getElementById('ranking-risk'),
  price: document.getElementById('ranking-price'),
  trial: document.getElementById('ranking-trial'),
  client: document.getElementById('ranking-client'),
  streaming: document.getElementById('ranking-streaming'),
  clear: document.getElementById('ranking-clear'),
  summary: document.getElementById('ranking-summary'),
  results: document.getElementById('ranking-results'),
  empty: document.getElementById('ranking-empty'),
  error: document.getElementById('ranking-error'),
};

let records = [];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function formatDate(value) {
  if (!value) return '未核对';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value));
}

function trialLabel(value) {
  if (value === true) return '支持试用';
  if (value === false) return '不支持试用';
  return '试用未核对';
}

function healthLabel(record) {
  if (record.health.reachable === null) return '官网未检查';
  if (!record.health.reachable) return '官网检查超时或失败';
  return `官网 ${record.health.successfulAttempts}/3 次可达 · 中位 ${record.health.medianResponseMs}ms`;
}

function healthHistoryLabel(record) {
  const history = record.healthHistory;
  if (!history) return '暂无历史样本 · 使用当前值';
  const mode = history.mode === 'rolling' ? '近 90 天平均' : '累计平均';
  return `${mode} ${history.websiteHealth.toFixed(1)} · ${history.sampleCount} 次 · ${formatDate(history.periodStart)} 至 ${formatDate(history.periodEnd)}`;
}

function capabilityTags(record) {
  const tags = [
    ...record.capabilities.clients,
    ...record.capabilities.streaming,
    ...record.capabilities.regions.slice(0, 3),
  ].slice(0, 6);
  if (!tags.length) return '<span class="ranking-tag is-muted">能力资料未核对</span>';
  return tags.map((tag) => `<span class="ranking-tag">${escapeHtml(tag)}</span>`).join('');
}

function renderCard(record, index) {
  const score = calculateScore(record.scoreInputs);
  const scoreText = score === null ? '—' : score.toFixed(1);
  const healthTone = record.health.reachable ? 'is-good' : 'is-failed';
  return `
    <article class="ranking-card risk-${record.risk.level}">
      <div class="ranking-position"><span>${String(index + 1).padStart(2, '0')}</span><small>RANK</small></div>
      <div class="ranking-card-main">
        <div class="ranking-card-heading">
          <div>
            <p class="ranking-kicker">${escapeHtml(riskLabel(record.risk.level))} · 核对于 ${escapeHtml(record.metadata.reviewedAt)}</p>
            <h2><a href="${escapeHtml(record.identity.detailUrl)}">${escapeHtml(record.identity.name)}</a></h2>
          </div>
          <div class="ranking-score"><strong>${scoreText}</strong><span>编辑评分</span></div>
        </div>
        <p class="ranking-conclusion">${escapeHtml(record.risk.summary)}</p>
        <div class="ranking-metrics">
          <span><small>月均门槛</small><b>${escapeHtml(formatPrice(record.pricing.monthlyFrom))}</b></span>
          <span><small>官网健康度（历史）</small><b>${record.scoreInputs.websiteHealth ?? '未核对'}</b></span>
          <span><small>易用性</small><b>${record.scoreInputs.usability}</b></span>
          <span><small>风险安全度</small><b>${record.scoreInputs.riskSafety}</b></span>
        </div>
        <div class="ranking-tags">${capabilityTags(record)}</div>
        <div class="ranking-card-foot">
          <span class="health-note ${healthTone}">${escapeHtml(healthLabel(record))} · ${escapeHtml(formatDate(record.health.checkedAt))}</span>
          <span>${escapeHtml(healthHistoryLabel(record))}</span>
          <span>${escapeHtml(trialLabel(record.pricing.hasTrial))}</span>
          <a href="${escapeHtml(record.identity.detailUrl)}">查看完整报告 <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </article>`;
}

function currentFilters() {
  return {
    query: elements.query.value,
    risk: elements.risk.value,
    maxPrice: elements.price.value,
    trial: elements.trial.value,
    client: elements.client.value,
    streaming: elements.streaming.value,
  };
}

function render() {
  const filtered = sortAirports(filterAirports(records, currentFilters()));
  elements.summary.textContent = `当前显示 ${filtered.length} / ${records.length} 个机场`;
  elements.results.innerHTML = filtered.map(renderCard).join('');
  elements.results.hidden = filtered.length === 0;
  elements.empty.hidden = filtered.length !== 0;
}

function populateSelect(select, values) {
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

function clearFilters() {
  elements.query.value = '';
  elements.risk.value = 'all';
  elements.price.value = '';
  elements.trial.value = 'all';
  elements.client.value = 'all';
  elements.streaming.value = 'all';
  render();
}

async function init() {
  try {
    records = await loadAirportRecords();
    populateSelect(elements.client, uniqueCapabilities(records, 'clients'));
    populateSelect(elements.streaming, uniqueCapabilities(records, 'streaming'));
    for (const element of [elements.query, elements.risk, elements.price, elements.trial, elements.client, elements.streaming]) {
      element.addEventListener(element === elements.query ? 'input' : 'change', render);
    }
    elements.clear.addEventListener('click', clearFilters);
    document.querySelector('[data-clear-ranking]')?.addEventListener('click', clearFilters);
    render();
  } catch (error) {
    elements.results.hidden = true;
    elements.empty.hidden = true;
    elements.summary.textContent = '机场资料未能载入';
    elements.error.hidden = false;
    elements.error.innerHTML = `<strong>榜单载入失败</strong><p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>`;
  }
}

init();
