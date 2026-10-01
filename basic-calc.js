/* ============================================================
 * basic-calc.js —— 三角函数 / 幂函数 / 四则运算 / 求和 / 指对数
 * 分别移植自 三角函数计算程序.py / 幂函数计算.py /
 *            加减乘除计算程序.py / 求和计算.py（指对数为补齐模块）
 * 每个函数返回 { ok: true, result, display } 或 { ok: false, error }
 * ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 三角函数（角度制，对应 三角函数计算程序.py） ---------- */
  function trigCalc(funcName, angleDeg) {
    const func = String(funcName || '').trim().toLowerCase();
    if (!['sin', 'cos', 'tan'].includes(func)) {
      return { ok: false, error: '无效的函数名，请选择 sin、cos 或 tan' };
    }
    const angle = parseFloat(angleDeg);
    if (isNaN(angle)) {
      return { ok: false, error: '输入无效，请输入数字' };
    }
    const rad = angle * Math.PI / 180;
    let result = null;
    if (func === 'sin') result = Math.sin(rad);
    else if (func === 'cos') result = Math.cos(rad);
    else {
      // tan：90° + 180°k 处无定义（与源程序判定一致）
      if (Math.abs((angle - 90) % 180) < 1e-9) {
        return { ok: false, error: `tan(${angle}°) 无定义（接近 90° + 180°k）` };
      }
      result = Math.tan(rad);
    }
    return {
      ok: true,
      result,
      display: `${func}(${angle}°) = ${result.toFixed(6)}`
    };
  }

  /* ---------- 幂函数（对应 幂函数计算.py） ---------- */
  // 安全求值：仅允许数字、小数点、运算符与括号（^ 已转为 **）
  function safeEvalExpr(str) {
    let s = String(str).trim().replace(/\^/g, '**');
    if (s === '') throw new Error('输入为空');
    if (!/^[0-9+\-*/().eE\s*]+$/.test(s)) throw new Error('包含非法字符');
    // 防止 "**" 被误认为指数形式之外的内容：JS 原生支持 **，直接求值
    // eslint-disable-next-line no-new-func
    const val = Function('"use strict"; return (' + s + ');')();
    if (typeof val !== 'number' || !isFinite(val)) throw new Error('计算结果无效');
    return val;
  }

  function powerCalc(baseStr, expStr) {
    let base, exp;
    try {
      base = safeEvalExpr(baseStr);
    } catch (e) {
      return { ok: false, error: `❌ 底数输入格式错误：${e.message}，请重新输入。` };
    }
    try {
      exp = safeEvalExpr(expStr);
    } catch (e) {
      return { ok: false, error: `❌ 指数输入格式错误：${e.message}，请重新输入。` };
    }
    const result = Math.pow(base, exp);
    if (!isFinite(result)) {
      return { ok: false, error: '❌ 计算结果无效（可能溢出或无定义），请检查输入。' };
    }
    return {
      ok: true,
      result,
      display: `${base} ^ ${exp} = ${formatNumber(result)}`
    };
  }

  /* ---------- 四则运算（对应 加减乘除计算程序.py） ---------- */
  function arithCalc(num1Str, op, num2Str) {
    const num1 = parseFloat(num1Str);
    const num2 = parseFloat(num2Str);
    if (isNaN(num1) || isNaN(num2)) {
      return { ok: false, error: '❌ 错误：输入的不是有效数字，请重新输入。' };
    }
    let result = null;
    let error = null;
    if (op === '+') result = num1 + num2;
    else if (op === '-') result = num1 - num2;
    else if (op === '*') result = num1 * num2;
    else if (op === '/') {
      if (num2 === 0) error = '❌ 错误：除数不能为零！';
      else result = num1 / num2;
    } else {
      error = `❌ 错误：不支持的运算符 '${op}'，请使用 +, -, *, /`;
    }
    if (error) return { ok: false, error };
    return {
      ok: true,
      result,
      display: `${num1} ${op} ${num2} = ${formatNumber(result)}`
    };
  }

  /* ---------- 求和（对应 求和计算.py） ---------- */
  function sumCalc(text, startFromPrev, prevValue) {
    let total = (startFromPrev && prevValue !== null && prevValue !== undefined) ? prevValue : 0;
    let count = 0;
    const invalidLines = [];
    const lines = String(text || '').split(/\r?\n/);
    for (const raw of lines) {
      const s = raw.trim();
      if (s === '') continue;
      const n = parseFloat(s);
      if (isNaN(n)) {
        invalidLines.push(s);
        continue;
      }
      total += n;
      count++;
    }
    if (count === 0 && !startFromPrev) {
      return { ok: false, error: '没有输入任何数字，无法求和' };
    }
    let display;
    if (count === 0) {
      display = `未新增数字，总和保持上次结果：${formatNumber(total)}`;
    } else {
      const prefix = (startFromPrev && prevValue !== null && prevValue !== undefined)
        ? `从上次结果 ${formatNumber(prevValue)} 继续，又输入 ${count} 个数字，`
        : `共输入 ${count} 个数字，`;
      display = `${prefix}总和为：${total.toFixed(6)}`;
    }
    if (invalidLines.length > 0) {
      display += `\n⚠️ 无效输入已忽略：${invalidLines.join('、')}`;
    }
    return { ok: true, result: total, display };
  }

  /* ---------- 指对数运算（补齐模块） ---------- */
  function expLogCalc(kind, xStr, aStr) {
    const x = parseFloat(xStr);
    if (isNaN(x)) {
      return { ok: false, error: '❌ 错误：输入的不是有效数字。' };
    }
    let result = null;
    let display = '';
    if (kind === 'exp') {
      result = Math.exp(x);
      display = `e^${x} = ${formatNumber(result)}`;
    } else if (kind === 'ln') {
      if (x <= 0) return { ok: false, error: '❌ 错误：ln 的真数必须大于 0。' };
      result = Math.log(x);
      display = `ln(${x}) = ${formatNumber(result)}`;
    } else if (kind === 'log10') {
      if (x <= 0) return { ok: false, error: '❌ 错误：log₁₀ 的真数必须大于 0。' };
      result = Math.log10(x);
      display = `log₁₀(${x}) = ${formatNumber(result)}`;
    } else if (kind === 'logab') {
      const a = parseFloat(aStr);
      if (isNaN(a)) return { ok: false, error: '❌ 错误：底数不是有效数字。' };
      if (a <= 0 || a === 1) return { ok: false, error: '❌ 错误：对数底数必须大于 0 且不等于 1。' };
      if (x <= 0) return { ok: false, error: '❌ 错误：真数必须大于 0。' };
      result = Math.log(x) / Math.log(a);
      display = `log(${a})(${x}) = ${formatNumber(result)}`;
    } else {
      return { ok: false, error: '❌ 错误：未知的运算类型。' };
    }
    if (!isFinite(result)) return { ok: false, error: '❌ 计算结果无效，请检查输入。' };
    return { ok: true, result, display };
  }

  /* ---------- 公共：数字格式化 ---------- */
  function formatNumber(v) {
    if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
    const s = parseFloat(v.toPrecision(10));
    if (Math.abs(s) >= 1e15 || (Math.abs(s) < 1e-6 && s !== 0)) return v.toExponential(6);
    return String(s);
  }

  global.BasicCalc = {
    trigCalc,
    powerCalc,
    arithCalc,
    sumCalc,
    expLogCalc,
    formatNumber
  };
})(typeof window !== 'undefined' ? window : globalThis);
