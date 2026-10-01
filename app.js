/* ============================================================
 * app.js —— 应用入口：导航切换、box 机制（对应主程序1.py 的 box.txt）、
 *           结果渲染、各模块交互绑定
 * ============================================================ */
(function () {
  'use strict';

  const BOX_KEY = 'calc-box';

  /* ==================== box 机制（对应源程序 box.txt） ==================== */
  function saveBox(value) {
    localStorage.setItem(BOX_KEY, String(value));
    updateBoxBadge();
  }
  function getBox() {
    const s = localStorage.getItem(BOX_KEY);
    if (s === null || s.trim() === '') return null;
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
  }
  function clearBox() {
    localStorage.removeItem(BOX_KEY);
    updateBoxBadge();
  }
  function updateBoxBadge() {
    const el = document.getElementById('box-value');
    if (!el) return;
    const box = getBox();
    el.textContent = box === null ? '空' : BasicCalc.formatNumber(box);
  }

  /* ==================== 结果渲染 ==================== */
  function renderResult(el, res) {
    if (!el) return;
    el.innerHTML = '';
    const div = document.createElement('div');
    if (res.ok) {
      div.className = 'result-box result-success';
      div.innerHTML = `<div class="result-icon">✅</div><div class="result-text"></div>`;
      div.querySelector('.result-text').textContent = res.display;
      saveBox(res.result);
    } else {
      div.className = 'result-box result-error';
      div.innerHTML = `<div class="result-icon">❌</div><div class="result-text"></div>`;
      div.querySelector('.result-text').textContent = res.error;
    }
    el.appendChild(div);
  }

  const $ = (id) => document.getElementById(id);

  /* ==================== 导航切换 ==================== */
  function initNav() {
    const items = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.panel');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.panel;
        items.forEach(i => i.classList.toggle('active', i === item));
        panels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + target));
      });
    });
  }

  /* ==================== 模块一：三角函数 ==================== */
  function initTrig() {
    $('btn-trig').addEventListener('click', () => {
      const res = BasicCalc.trigCalc($('trig-func').value, $('trig-angle').value);
      renderResult($('trig-result'), res);
    });
    $('trig-angle').addEventListener('keydown', e => {
      if (e.key === 'Enter') $('btn-trig').click();
    });
  }

  /* ==================== 模块二：幂函数 ==================== */
  function initPower() {
    $('btn-power-use-base').addEventListener('click', () => {
      const box = getBox();
      if (box === null) { alert('box 为空，暂无上次结果可填入'); return; }
      $('power-base').value = String(box);
    });
    $('btn-power-use-exp').addEventListener('click', () => {
      const box = getBox();
      if (box === null) { alert('box 为空，暂无上次结果可填入'); return; }
      $('power-exp').value = String(box);
    });
    $('btn-power').addEventListener('click', () => {
      const res = BasicCalc.powerCalc($('power-base').value, $('power-exp').value);
      renderResult($('power-result'), res);
    });
  }

  /* ==================== 模块三：一阶导数 ==================== */
  let lastDerAst = null;

  function initDerivative() {
    $('btn-deriv').addEventListener('click', () => {
      lastDerAst = null;
      const container = $('deriv-result');
      container.innerHTML = '';
      try {
        const { derAst, derStr } = Derivative.differentiate($('deriv-expr').value);
        lastDerAst = derAst;
        const div = document.createElement('div');
        div.className = 'result-box result-success';
        div.innerHTML = `<div class="result-icon">✅</div><div class="result-text"></div>`;
        div.querySelector('.result-text').innerHTML =
          `f(x) = <span class="math-expr"></span><br>f'(x) = <span class="math-expr math-strong"></span>`;
        const spans = div.querySelectorAll('.math-expr');
        spans[0].textContent = $('deriv-expr').value.trim();
        spans[1].textContent = derStr;
        container.appendChild(div);
        $('deriv-point-row').classList.remove('hidden');
        $('deriv-point').value = '';
        $('deriv-point-result').innerHTML = '';
      } catch (e) {
        renderResult(container, { ok: false, error: '❌ 错误：' + e.message });
        $('deriv-point-row').classList.add('hidden');
      }
    });
    $('btn-deriv-point').addEventListener('click', () => {
      if (!lastDerAst) return;
      const pointStr = $('deriv-point').value.trim();
      const point = parseFloat(pointStr);
      if (isNaN(point)) {
        renderResult($('deriv-point-result'), { ok: false, error: '❌ 错误：请输入有效的数字。' });
        return;
      }
      try {
        const value = Derivative.evaluateAt(lastDerAst, point);
        if (!isFinite(value)) {
          renderResult($('deriv-point-result'), { ok: false, error: `❌ f'(${point}) 无定义或发散。` });
          return;
        }
        renderResult($('deriv-point-result'), {
          ok: true,
          result: value,
          display: `f'(${point}) = ${BasicCalc.formatNumber(value)}`
        });
      } catch (e) {
        renderResult($('deriv-point-result'), { ok: false, error: '❌ ' + e.message });
      }
    });
  }

  /* ==================== 模块四：求和 ==================== */
  function initSum() {
    $('btn-sum').addEventListener('click', () => {
      const cont = $('sum-continue').checked;
      const prev = getBox();
      if (cont && prev === null) {
        renderResult($('sum-result'), { ok: false, error: '❌ box 为空，无法从上次结果继续累加。' });
        return;
      }
      const res = BasicCalc.sumCalc($('sum-input').value, cont, prev);
      renderResult($('sum-result'), res);
    });
  }

  /* ==================== 模块五：四则运算 ==================== */
  function initArith() {
    $('btn-arith').addEventListener('click', () => {
      const res = BasicCalc.arithCalc($('arith-num1').value, $('arith-op').value, $('arith-num2').value);
      renderResult($('arith-result'), res);
    });
  }

  /* ==================== 模块六：指对数运算 ==================== */
  function initExpLog() {
    const kindSel = $('explog-kind');
    const syncFields = () => {
      const isAB = kindSel.value === 'logab';
      $('explog-a-row').classList.toggle('hidden', !isAB);
      const labels = { exp: 'x 的值', ln: '真数 x（x > 0）', log10: '真数 x（x > 0）', logab: '真数 x（x > 0）' };
      $('explog-x-label').textContent = labels[kindSel.value] || 'x 的值';
    };
    kindSel.addEventListener('change', syncFields);
    syncFields();
    $('btn-explog').addEventListener('click', () => {
      const res = BasicCalc.expLogCalc(kindSel.value, $('explog-x').value, $('explog-a').value);
      renderResult($('explog-result'), res);
    });
  }

  /* ==================== 模块七：物理公式表 ==================== */
  function initFormulaTable() {
    const container = $('formula-table-container');
    Physics.FORMULA_TABLE.forEach(group => {
      const section = document.createElement('div');
      section.className = 'formula-group';
      const h = document.createElement('h3');
      h.className = 'formula-group-title';
      h.textContent = group.category;
      section.appendChild(h);

      const table = document.createElement('table');
      table.className = 'formula-table';
      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th style="width:220px">公式名称</th><th>详细内容</th></tr>';
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      group.entries.forEach(entry => {
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        td1.textContent = entry.name;
        const td2 = document.createElement('td');
        td2.textContent = entry.content;
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      section.appendChild(table);
      container.appendChild(section);
    });
  }

  /* ==================== 模块八：物理公式计算 ==================== */
  function initPhysicsCalc() {
    // 变量速查表
    const refContainer = $('var-ref-container');
    const table = document.createElement('table');
    table.className = 'formula-table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>变量名</th><th>物理意义</th><th>单位</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    Object.keys(Physics.VAR_INFO).forEach(v => {
      const info = Physics.VAR_INFO[v];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><code></code></td><td></td><td></td>`;
      tr.children[0].querySelector('code').textContent = v;
      tr.children[1].textContent = info[0];
      tr.children[2].textContent = info[1];
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    refContainer.appendChild(table);

    $('btn-phys').addEventListener('click', () => {
      const container = $('phys-result');
      container.innerHTML = '';

      const knownStr = $('phys-known').value.trim();
      const knownDict = Physics.parseUserInput(knownStr);
      if (Object.keys(knownDict).length === 0) {
        renderResult(container, { ok: false, error: '未识别到任何已知量，请按格式输入（如 v0=0, s=100, t=5）。' });
        return;
      }
      const target = $('phys-target').value.trim();
      if (!target) {
        renderResult(container, { ok: false, error: '目标变量不能为空。' });
        return;
      }

      const { solutions, missingHint } = Physics.derivePaths(knownDict, target);
      if (solutions.length > 0) {
        const header = document.createElement('div');
        header.className = 'phys-summary';
        header.textContent = `找到 ${solutions.length} 种推导方式（步数最短为 ${solutions[0].length} 步）：`;
        container.appendChild(header);

        solutions.forEach((path, i) => {
          const card = document.createElement('div');
          card.className = 'phys-card';
          const title = document.createElement('div');
          title.className = 'phys-card-title';
          title.textContent = `方式 ${i + 1}${i === 0 ? '【最简】' : ''}`;
          card.appendChild(title);

          if (path.length === 0) {
            const line = document.createElement('div');
            line.className = 'phys-step';
            line.textContent = `目标变量 ${Physics.formatVar(target)} 已已知，无需计算。`;
            card.appendChild(line);
          } else {
            path.forEach(step => {
              const [formulaName, varName, value] = step;
              const line = document.createElement('div');
              line.className = 'phys-step';
              line.textContent = `使用「${formulaName}」→ ${Physics.formatVar(varName)} = ${formatPhysValue(value)}`;
              card.appendChild(line);
            });
            const finalLine = document.createElement('div');
            finalLine.className = 'phys-step phys-final';
            const lastStep = path[path.length - 1];
            finalLine.textContent = `最终 ${Physics.formatVar(target)} = ${formatPhysValue(lastStep[2])}`;
            card.appendChild(finalLine);
            saveBox(lastStep[2]);
          }
          container.appendChild(card);
        });
        if (solutions.length > 1) {
          const note = document.createElement('div');
          note.className = 'phys-note';
          note.textContent = '注：以上路径步数相同，均为最简方式。';
          container.appendChild(note);
        }
      } else {
        let msg = '无法根据当前已知量计算出目标变量。';
        if (missingHint && missingHint.size > 0) {
          const missingStr = Array.from(missingHint).map(v => Physics.formatVar(v)).join('、');
          msg += `\n根据公式库，可能还需要以下变量中的一个或多个：${missingStr}\n请补充这些已知量后重试。`;
        } else {
          msg += '\n请检查变量名是否正确，或尝试补充其他已知量。';
        }
        renderResult(container, { ok: false, error: msg });
      }
    });
  }

  function formatPhysValue(v) {
    return parseFloat(v.toPrecision(6)).toString();
  }

  /* ==================== 启动 ==================== */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initTrig();
    initPower();
    initDerivative();
    initSum();
    initArith();
    initExpLog();
    initFormulaTable();
    initPhysicsCalc();
    updateBoxBadge();

    $('btn-clear-box').addEventListener('click', () => {
      clearBox();
    });
  });
})();
