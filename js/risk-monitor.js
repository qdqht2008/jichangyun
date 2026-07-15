import { loadAirportRecords, riskLabel } from './airport-data.mjs';

const groupsElement = document.getElementById('risk-groups');
const errorElement = document.getElementById('risk-error');
const groupOrder = ['high', 'watch', 'normal'];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function advice(level) {
  if (level === 'high') return '暂停购买，等待官网、服务或公开投诉得到复核。';
  if (level === 'watch') return '只考虑短周期，并在付款前再次核对证据。';
  return '仍建议从短周期开始，并独立核对退款、设备与地区限制。';
}

function renderRecord(record, events) {
  const relatedEvents = events.filter((event) => event.airportSlug === record.identity.slug);
  const evidence = [...record.risk.evidence, ...relatedEvents.map((event) => event.summary)];
  const evidenceHtml = evidence.length
    ? `<ul>${evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="risk-no-event">当前未记录可核验异常；这不是未来安全保证。</p>';
  return `
    <article class="risk-record">
      <div class="risk-record-head">
        <div><span class="risk-status risk-${record.risk.level}">${escapeHtml(riskLabel(record.risk.level))}</span><h3>${escapeHtml(record.identity.name)}</h3></div>
        <time datetime="${escapeHtml(record.risk.reviewedAt)}">核对 ${escapeHtml(record.risk.reviewedAt)}</time>
      </div>
      <p>${escapeHtml(record.risk.summary)}</p>
      ${evidenceHtml}
      <div class="risk-advice"><strong>建议</strong><span>${escapeHtml(advice(record.risk.level))}</span></div>
      <a class="risk-report-link" href="${escapeHtml(record.identity.detailUrl)}">查看机场报告 <span aria-hidden="true">→</span></a>
    </article>`;
}

async function loadRiskEvents() {
  const response = await fetch('/data/risk-events.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`风险事件加载失败：HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.events)) throw new Error('风险事件数据校验失败');
  return payload.events;
}

async function init() {
  try {
    const [records, events] = await Promise.all([loadAirportRecords(), loadRiskEvents()]);
    groupsElement.innerHTML = groupOrder.map((level) => {
      const items = records.filter((record) => record.risk.level === level);
      return `
        <section class="risk-group risk-group-${level}">
          <header><div><p class="data-eyebrow">${escapeHtml(level.toUpperCase())}</p><h2>${escapeHtml(riskLabel(level))}</h2></div><strong>${items.length}</strong></header>
          <div class="risk-record-grid">${items.length ? items.map((record) => renderRecord(record, events)).join('') : '<p class="risk-group-empty">当前没有这一状态的记录。</p>'}</div>
        </section>`;
    }).join('');
  } catch (error) {
    groupsElement.hidden = true;
    errorElement.hidden = false;
    errorElement.innerHTML = `<strong>风险资料载入失败</strong><p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>`;
  }
}

init();
