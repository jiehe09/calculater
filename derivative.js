/* ============================================================
 * derivative.js —— 自实现一阶符号求导引擎（零依赖，离线可用）
 * 对应 一阶导数.py（sympy 符号求导 + 某点求值）
 * 支持：+ - * / ^（或 **）、括号、一元负号、隐式乘法（如 2x）
 * 函数：sin cos tan exp ln log(以10为底) sqrt
 * 常量：pi、e　　求导变量：x
 * ============================================================ */
(function (global) {
  'use strict';

  const FUNCS = ['sin', 'cos', 'tan', 'exp', 'ln', 'log', 'sqrt'];
  const CONSTS = { pi: Math.PI, e: Math.E };

  /* ==================== 词法分析 ==================== */
  function tokenize(src) {
    src = src.replace(/\*\*/g, '^'); // 兼容 Python 风格 **
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        let j = i;
        while (j < src.length && /[0-9.]/.test(src[j])) j++;
        const text = src.slice(i, j);
        if ((text.match(/\./g) || []).length > 1) throw new Error(`无效数字 "${text}"`);
        tokens.push({ type: 'num', value: parseFloat(text) });
        i = j;
        continue;
      }
      if (/[a-zA-Z]/.test(ch)) {
        let j = i;
        while (j < src.length && /[a-zA-Z0-9]/.test(src[j])) j++;
        tokens.push({ type: 'ident', value: src.slice(i, j) });
        i = j;
        continue;
      }
      if ('+-*/^()'.includes(ch)) {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }
      throw new Error(`无法识别的字符 "${ch}"`);
    }
    return tokens;
  }

  /* ==================== 语法分析（递归下降） ==================== */
  // AST 节点：{type:'num'|'var'|'unary'|'bin'|'func', ...}
  function parse(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];
    const expectOp = (op) => {
      const t = next();
      if (!t || t.type !== 'op' || t.value !== op) throw new Error(`缺少 "${op}"`);
    };

    function parseExpr() {
      let node = parseTerm();
      while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
        const op = next().value;
        node = { type: 'bin', op, left: node, right: parseTerm() };
      }
      return node;
    }

    function parseTerm() {
      let node = parseUnary();
      for (;;) {
        const t = peek();
        if (t && t.type === 'op' && (t.value === '*' || t.value === '/')) {
          const op = next().value;
          node = { type: 'bin', op, left: node, right: parseUnary() };
        } else if (t && (t.type === 'num' || t.type === 'ident' || t.value === '(')) {
          // 隐式乘法：2x、2(x+1)、x sin(x)、(a)(b)
          node = { type: 'bin', op: '*', left: node, right: parseUnary() };
        } else {
          break;
        }
      }
      return node;
    }

    function parseUnary() {
      const t = peek();
      if (t && t.type === 'op' && (t.value === '-' || t.value === '+')) {
        next();
        const arg = parseUnary();
        return t.value === '-' ? { type: 'unary', op: '-', arg } : arg;
      }
      return parsePower();
    }

    function parsePower() {
      const base = parseAtom();
      const t = peek();
      if (t && t.type === 'op' && t.value === '^') {
        next();
        const exp = parseUnary(); // 右结合，且允许 2^-3
        return { type: 'bin', op: '^', left: base, right: exp };
      }
      return base;
    }

    function parseAtom() {
      const t = next();
      if (!t) throw new Error('表达式不完整');
      if (t.type === 'num') return { type: 'num', value: t.value };
      if (t.type === 'ident') {
        const name = t.value;
        if (FUNCS.includes(name)) {
          if (!peek() || peek().value !== '(') throw new Error(`函数 ${name} 后缺少括号`);
          expectOp('(');
          const arg = parseExpr();
          expectOp(')');
          return { type: 'func', name, arg };
        }
        return { type: 'var', name };
      }
      if (t.type === 'op' && t.value === '(') {
        const node = parseExpr();
        expectOp(')');
        return node;
      }
      throw new Error(`意外的符号 "${t.value}"`);
    }

    const ast = parseExpr();
    if (pos < tokens.length) throw new Error(`多余的符号 "${tokens[pos].value}"`);
    return ast;
  }

  /* ==================== 辅助判断 ==================== */
  function containsX(node) {
    switch (node.type) {
      case 'num': return false;
      case 'var': return node.name === 'x';
      case 'unary': return containsX(node.arg);
      case 'bin': return containsX(node.left) || containsX(node.right);
      case 'func': return containsX(node.arg);
    }
    return false;
  }

  const num = v => ({ type: 'num', value: v });
  const add = (a, b) => ({ type: 'bin', op: '+', left: a, right: b });
  const sub = (a, b) => ({ type: 'bin', op: '-', left: a, right: b });
  const mul = (a, b) => ({ type: 'bin', op: '*', left: a, right: b });
  const div = (a, b) => ({ type: 'bin', op: '/', left: a, right: b });
  const pow = (a, b) => ({ type: 'bin', op: '^', left: a, right: b });
  const fn = (name, arg) => ({ type: 'func', name, arg });

  /* ==================== 求导规则 ==================== */
  function diff(node) {
    switch (node.type) {
      case 'num':
        return num(0);
      case 'var':
        return num(node.name === 'x' ? 1 : 0);
      case 'unary':
        return { type: 'unary', op: '-', arg: diff(node.arg) };
      case 'bin': {
        const { op, left: l, right: r } = node;
        const dl = diff(l);
        const dr = diff(r);
        if (op === '+') return add(dl, dr);
        if (op === '-') return sub(dl, dr);
        if (op === '*') return add(mul(dl, r), mul(l, dr)); // 乘法法则
        if (op === '/') return div(sub(mul(dl, r), mul(l, dr)), pow(r, num(2))); // 商法则
        if (op === '^') {
          if (!containsX(r)) {
            // 幂规则：(f^n)' = n·f^(n-1)·f'
            return mul(mul(r, pow(l, sub(r, num(1)))), dl);
          }
          if (!containsX(l)) {
            // (a^g)' = a^g · ln(a) · g'
            return mul(mul(node, fn('ln', l)), dr);
          }
          // 一般情形：(f^g)' = f^g · (g'·ln f + g·f'/f)
          return mul(node, add(mul(dr, fn('ln', l)), div(mul(r, dl), l)));
        }
        break;
      }
      case 'func': {
        const u = node.arg;
        const du = diff(u); // 链式法则
        switch (node.name) {
          case 'sin': return mul(fn('cos', u), du);
          case 'cos': return mul({ type: 'unary', op: '-', arg: fn('sin', u) }, du);
          case 'tan': return div(du, pow(fn('cos', u), num(2)));
          case 'exp': return mul(fn('exp', u), du);
          case 'ln': return div(du, u);
          case 'log': return div(du, mul(u, fn('ln', num(10))));
          case 'sqrt': return div(du, mul(num(2), fn('sqrt', u)));
        }
        break;
      }
    }
    throw new Error('无法对该表达式求导');
  }

  /* ==================== 化简 ==================== */
  function isNum(n, v) { return n.type === 'num' && (v === undefined || n.value === v); }

  function simplify(node) {
    if (node.type === 'num' || node.type === 'var') return node;
    if (node.type === 'unary') {
      const a = simplify(node.arg);
      if (a.type === 'num') return num(-a.value);
      if (a.type === 'unary') return a;
      return { type: 'unary', op: '-', arg: a };
    }
    if (node.type === 'func') {
      const a = simplify(node.arg);
      if (a.type === 'num') {
        const v = evalFunc(node.name, a.value);
        if (isFinite(v)) return num(v);
      }
      return fn(node.name, a);
    }
    // bin
    const l = simplify(node.left);
    const r = simplify(node.right);
    const op = node.op;

    // 常数折叠
    if (l.type === 'num' && r.type === 'num') {
      let v;
      if (op === '+') v = l.value + r.value;
      else if (op === '-') v = l.value - r.value;
      else if (op === '*') v = l.value * r.value;
      else if (op === '/') v = r.value !== 0 ? l.value / r.value : NaN;
      else if (op === '^') v = Math.pow(l.value, r.value);
      if (isFinite(v)) return num(v);
    }

    if (op === '+') {
      if (isNum(l, 0)) return r;
      if (isNum(r, 0)) return l;
    } else if (op === '-') {
      if (isNum(r, 0)) return l;
      if (isNum(l, 0)) return simplify({ type: 'unary', op: '-', arg: r });
      if (toString(l) === toString(r)) return num(0);
    } else if (op === '*') {
      if (isNum(l, 0) || isNum(r, 0)) return num(0);
      if (isNum(l, 1)) return r;
      if (isNum(r, 1)) return l;
      if (isNum(l, -1)) return simplify({ type: 'unary', op: '-', arg: r });
      if (isNum(r, -1)) return simplify({ type: 'unary', op: '-', arg: l });
    } else if (op === '/') {
      if (isNum(l, 0) && !isNum(r, 0)) return num(0);
      if (isNum(r, 1)) return l;
      if (toString(l) === toString(r)) return num(1);
    } else if (op === '^') {
      if (isNum(r, 0)) return num(1);
      if (isNum(r, 1)) return l;
      if (isNum(l, 0)) return num(0);
      if (isNum(l, 1)) return num(1);
    }
    return { type: 'bin', op, left: l, right: r };
  }

  function evalFunc(name, v) {
    switch (name) {
      case 'sin': return Math.sin(v);
      case 'cos': return Math.cos(v);
      case 'tan': return Math.tan(v);
      case 'exp': return Math.exp(v);
      case 'ln': return Math.log(v);
      case 'log': return Math.log10(v);
      case 'sqrt': return Math.sqrt(v);
    }
    return NaN;
  }

  /* ==================== 输出为中缀字符串 ==================== */
  const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
  const UNARY_PREC = 2.5;

  function fmtNum(v) {
    if (Number.isInteger(v)) return String(v);
    return String(parseFloat(v.toPrecision(12)));
  }

  function toString(node) {
    switch (node.type) {
      case 'num': return fmtNum(node.value);
      case 'var': return node.name;
      case 'unary': {
        const s = toString(node.arg);
        const needParen = precOf(node.arg) < PREC['^'];
        return '-' + (needParen ? '(' + s + ')' : s);
      }
      case 'func': return `${node.name}(${toString(node.arg)})`;
      case 'bin': {
        const my = PREC[node.op];
        let ls = toString(node.left);
        let rs = toString(node.right);
        const lp = precOf(node.left);
        const rp = precOf(node.right);
        // 左操作数
        if (lp < my) ls = '(' + ls + ')';
        // 右操作数（考虑结合性）
        if (node.op === '-' && rp <= my) rs = '(' + rs + ')';
        else if (node.op === '/' && rp <= my) rs = '(' + rs + ')';
        else if (node.op === '^' && rp < my) rs = '(' + rs + ')';
        else if ((node.op === '+' || node.op === '*') && rp < my) rs = '(' + rs + ')';
        return `${ls} ${node.op} ${rs}`;
      }
    }
    return '?';
  }

  function precOf(node) {
    if (node.type === 'bin') return PREC[node.op];
    if (node.type === 'unary') return UNARY_PREC;
    return Infinity; // num / var / func 无需括号
  }

  /* ==================== 数值求值 ==================== */
  function evaluate(node, xval) {
    switch (node.type) {
      case 'num': return node.value;
      case 'var':
        if (node.name === 'x') return xval;
        if (node.name in CONSTS) return CONSTS[node.name];
        throw new Error(`表达式含未知变量 "${node.name}"（仅支持变量 x）`);
      case 'unary': return -evaluate(node.arg, xval);
      case 'func': return evalFunc(node.name, evaluate(node.arg, xval));
      case 'bin': {
        const a = evaluate(node.left, xval);
        const b = evaluate(node.right, xval);
        switch (node.op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return a / b;
          case '^': return Math.pow(a, b);
        }
      }
    }
    return NaN;
  }

  /* ==================== 对外接口 ==================== */
  global.Derivative = {
    /**
     * 解析并求导。
     * @returns {{ast: object, derStr: string, derAst: object}}
     * @throws {Error} 解析失败时抛出"无法解析输入的表达式"类错误
     */
    differentiate(exprStr) {
      let tokens;
      try {
        tokens = tokenize(String(exprStr).trim());
      } catch (e) {
        throw new Error('无法解析输入的表达式，请检查语法。');
      }
      if (tokens.length === 0) throw new Error('无法解析输入的表达式，请检查语法。');
      let ast;
      try {
        ast = parse(tokens);
      } catch (e) {
        throw new Error('无法解析输入的表达式，请检查语法。');
      }
      const derAst = simplify(diff(ast));
      return { ast, derAst, derStr: toString(derAst) };
    },
    /** 计算（导数）表达式在 x = x0 处的值 */
    evaluateAt(ast, x0) {
      return evaluate(ast, x0);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
