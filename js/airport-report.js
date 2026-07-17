import { formatPrice, loadAirportRecords, riskLabel } from './airport-data.mjs';

const mount = document.getElementById('airport-data-report');

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function capabilityList(values, fallback = '未核对') {
  if (!values.length) return `<span class="report-unknown">${fallback}</span>`;
  return values.map((value) => `<span>${escapeHtml(value)}</span>`).join('');
}

function healthSummary(record) {
  if (record.health.reachable === null) return '尚未执行官网检查';
  if (!record.health.reachable) return `三次官网请求未达到 2/3 可达门槛：${record.health.error}`;
  return `${record.health.successfulAttempts}/3 次请求成功，中位响应 ${record.health.medianResponseMs}ms，HTTP ${record.health.httpStatus}`;
}

function renderReport(record) {
  const trial = record.pricing.hasTrial === null ? '未核对' : record.pricing.hasTrial ? '支持' : '不支持';
  mount.innerHTML = `
    <div class="airport-report-head">
      <div>
        <p class="data-eyebrow">AIRPORT DATA REPORT</p>
        <h2>公开资料与风险快照</h2>
        <p>资料来自当前详情页、公开官网检查与明确购买限制，不代表节点速度、线路稳定性或实际解锁。</p>
      </div>
    </div>
    <div class="airport-report-facts">
      <span><small>风险状态</small><b class="risk-text-${record.risk.level}">${escapeHtml(riskLabel(record.risk.level))}</b></span>
      <span><small>月均门槛</small><b>${escapeHtml(formatPrice(record.pricing.monthlyFrom))}</b></span>
      <span><small>试用资料</small><b>${escapeHtml(trial)}</b></span>
      <span><small>最近核对</small><b>${escapeHtml(record.metadata.reviewedAt)}</b></span>
    </div>
    <div class="airport-report-health ${record.health.reachable ? 'is-reachable' : 'is-unreachable'}">
      <div><strong>官网检查</strong><span>${escapeHtml(healthSummary(record))}</span></div>
      <time datetime="${escapeHtml(record.health.checkedAt ?? '')}">${record.health.checkedAt ? `检查于 ${escapeHtml(record.health.checkedAt.replace('T', ' ').slice(0, 16))} UTC` : '尚未检查'}</time>
    </div>
    <div class="airport-report-capabilities">
      <div><strong>客户端</strong><p>${capabilityList(record.capabilities.clients)}</p></div>
      <div><strong>流媒体 / AI</strong><p>${capabilityList(record.capabilities.streaming, '未核对具体平台')}</p></div>
      <div><strong>节点地区</strong><p>${capabilityList(record.capabilities.regions)}</p></div>
    </div>
    <div class="airport-report-risk">
      <strong>风险结论</strong><p>${escapeHtml(record.risk.summary)}</p>
    </div>
    <div class="airport-report-links"><a href="/rankings/">返回机场榜</a><a href="/risk-monitor/">查看风险监测</a></div>`;
}

async function init() {
  if (!mount) return;
  try {
    const records = await loadAirportRecords();
    const record = records.find((item) => item.identity.slug === mount.dataset.airportSlug);
    if (!record) throw new Error(`未找到 ${mount.dataset.airportSlug} 的机场数据`);
    renderReport(record);
  } catch (error) {
    mount.classList.add('airport-report-error');
    mount.innerHTML = `<strong>公开资料载入失败</strong><p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p><p>原有套餐正文仍可继续阅读。</p>`;
  }
}

init();
