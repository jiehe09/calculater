/* ============================================================
 * physics.js —— 物理公式表 + 公式库 + BFS 推导引擎
 * 移植自 物理公式表.py 与 物理公式计算.py
 * ============================================================ */
(function (global) {
  'use strict';

  /* ==================== 一、变量中文名及单位 ==================== */
  const VAR_INFO = {
    'v': ['速度', 'm/s'],
    's': ['位移', 'm'],
    't': ['时间', 's'],
    'rho': ['密度', 'kg/m³'],
    'm': ['质量', 'kg'],
    'V': ['体积', 'm³'],
    'G': ['重力', 'N'],
    'g': ['重力加速度', 'N/kg 或 m/s²'],
    'F': ['力', 'N'],
    'S': ['受力面积', 'm²'],
    'h': ['高度/深度', 'm'],
    'F_float': ['浮力', 'N'],
    'rho_liquid': ['液体密度', 'kg/m³'],
    'V_disp': ['排开液体体积', 'm³'],
    'F1': ['力1', 'N'],
    'l1': ['力臂1', 'm'],
    'F2': ['力2', 'N'],
    'l2': ['力臂2', 'm'],
    'G_dyn': ['动滑轮重力', 'N'],
    'G_obj': ['物体重力', 'N'],
    'n': ['绳子股数', '（无单位）'],
    's_rope': ['绳端移动距离', 'm'],
    'h_lift': ['物体上升高度', 'm'],
    'W': ['功', 'J'],
    'P': ['功率', 'W'],
    'eta': ['机械效率', '（无单位）'],
    'W_useful': ['有用功', 'J'],
    'W_total': ['总功', 'J'],
    // 热学
    'Q': ['热量', 'J'],
    'c': ['比热容', 'J/(kg·℃)'],
    'delta_t': ['温度变化', '℃'],
    'q_fuel': ['热值', 'J/kg 或 J/m³'],
    // 电学
    'I': ['电流', 'A'],
    'U': ['电压', 'V'],
    'R': ['电阻', 'Ω'],
    // 光学
    'f_lens': ['焦距', 'm'],
    'u': ['物距', 'm'],
    'v_image': ['像距', 'm'],
    // 高中运动学
    'v0': ['初速度', 'm/s'],
    'a': ['加速度', 'm/s²'],
    'v_avg': ['平均速度', 'm/s'],
    'v_mid_t': ['中间时刻速度', 'm/s'],
    'v_mid_s': ['中间位置速度', 'm/s'],
    'omega': ['角速度', 'rad/s'],
    'r': ['半径', 'm'],
    'T': ['周期', 's'],
    'f': ['频率', 'Hz'],
    'a_n': ['向心加速度', 'm/s²'],
    'F_n': ['向心力', 'N'],
    'x': ['水平位移', 'm'],
    'y': ['竖直位移', 'm'],
    'vx': ['水平分速度', 'm/s'],
    'vy': ['竖直分速度', 'm/s'],
    'l': ['摆长', 'm'],
    'h_max': ['最大高度', 'm'],
    't_total': ['往返时间', 's'],
    // 力学高中
    'k': ['劲度系数', 'N/m'],
    'x_spring': ['形变量', 'm'],
    'N': ['正压力', 'N'],
    'G_const': ['万有引力常量', 'N·m²/kg²'],
    'm1': ['质量1', 'kg'],
    'm2': ['质量2', 'kg'],
    'r_dist': ['距离', 'm'],
    // 功和能
    'Ek': ['动能', 'J'],
    'Ep': ['重力势能', 'J'],
    'Ep_spring': ['弹性势能', 'J'],
    // 动量
    'Ft': ['冲量', 'N·s'],
    'v1': ['物体1初速度', 'm/s'],
    'v2': ['物体2初速度', 'm/s'],
    // 电场
    'k_coulomb': ['库仑常量', 'N·m²/C²'],
    'q1': ['电荷量1', 'C'],
    'q2': ['电荷量2', 'C'],
    'E_field': ['电场强度', 'N/C'],
    'q': ['电荷量', 'C'],
    'phi': ['电势', 'V'],
    'Ep_elec': ['电势能', 'J'],
    'U_ab': ['电压', 'V'],
    // 磁场
    'B': ['磁感应强度', 'T'],
    'L': ['导体长度', 'm'],
    'f_L': ['洛伦兹力', 'N'],
    // 电磁感应
    'E_ind': ['感应电动势', 'V'],
    'n_coil': ['匝数', '（无单位）'],
    'delta_phi': ['磁通量变化量', 'Wb'],
    'delta_t_time': ['时间变化', 's'],
    // 气体
    'p1': ['初压强', 'Pa'],
    'V1': ['初体积', 'm³'],
    'p2': ['末压强', 'Pa'],
    'V2': ['末体积', 'm³'],
    'T1': ['初温度', 'K'],
    'T2': ['末温度', 'K'],
    'mu': ['摩尔质量', 'kg/mol'],
    'R_gas': ['气体常量', 'J/(mol·K)'],
    // 波
    'lambda': ['波长', 'm'],
    'v_wave': ['波速', 'm/s'],
    // 近代
    'c_light': ['光速', 'm/s'],
    'E_mc': ['能量', 'J'],
    'pi': ['圆周率', '（常量）'],
    // 摩擦力（滑动摩擦力公式中用 F 表示摩擦力，mu 亦表示动摩擦因数）
  };
  // 与源程序一致：'p' 同时表示压强与动量，'mu' 同时表示动摩擦因数与摩尔质量，
  // Python 字典后定义覆盖前者，此处保持相同行为
  VAR_INFO['p'] = ['动量', 'kg·m/s'];

  /* ==================== 二、默认常量（用户可覆盖） ==================== */
  const DEFAULT_CONSTANTS = {
    'g': 10,
    'G_const': 6.67e-11,
    'k_coulomb': 8.99e9,
    'R_gas': 8.314,
    'c_light': 3.0e8,
    'pi': Math.PI
  };

  /* ==================== 三、公式库（逐条移植自源程序） ==================== */
  const formulas = [];

  // 1. 速度定义
  formulas.push({
    name: '速度定义 v=s/t',
    variables: ['v', 's', 't'],
    solve: {
      'v': d => d['t'] !== 0 ? d['s'] / d['t'] : null,
      's': d => d['v'] * d['t'],
      't': d => d['v'] !== 0 ? d['s'] / d['v'] : null
    }
  });
  // 2. 密度
  formulas.push({
    name: '密度 ρ=m/V',
    variables: ['rho', 'm', 'V'],
    solve: {
      'rho': d => d['V'] !== 0 ? d['m'] / d['V'] : null,
      'm': d => d['rho'] * d['V'],
      'V': d => d['rho'] !== 0 ? d['m'] / d['rho'] : null
    }
  });
  // 3. 重力
  formulas.push({
    name: '重力 G=mg',
    variables: ['G', 'm', 'g'],
    solve: {
      'G': d => d['m'] * d['g'],
      'm': d => d['g'] !== 0 ? d['G'] / d['g'] : null,
      'g': d => d['m'] !== 0 ? d['G'] / d['m'] : null
    }
  });
  // 4. 压强
  formulas.push({
    name: '压强 p=F/S',
    variables: ['p', 'F', 'S'],
    solve: {
      'p': d => d['S'] !== 0 ? d['F'] / d['S'] : null,
      'F': d => d['p'] * d['S'],
      'S': d => d['p'] !== 0 ? d['F'] / d['p'] : null
    }
  });
  // 5. 液体压强
  formulas.push({
    name: '液体压强 p=ρgh',
    variables: ['p', 'rho', 'g', 'h'],
    solve: {
      'p': d => d['rho'] * d['g'] * d['h'],
      'rho': d => d['g'] * d['h'] !== 0 ? d['p'] / (d['g'] * d['h']) : null,
      'h': d => d['rho'] * d['g'] !== 0 ? d['p'] / (d['rho'] * d['g']) : null,
      'g': d => d['rho'] * d['h'] !== 0 ? d['p'] / (d['rho'] * d['h']) : null
    }
  });
  // 6. 阿基米德原理
  formulas.push({
    name: '阿基米德原理 F浮=ρ液gV排',
    variables: ['F_float', 'rho_liquid', 'g', 'V_disp'],
    solve: {
      'F_float': d => d['rho_liquid'] * d['g'] * d['V_disp'],
      'rho_liquid': d => d['g'] * d['V_disp'] !== 0 ? d['F_float'] / (d['g'] * d['V_disp']) : null,
      'V_disp': d => d['rho_liquid'] * d['g'] !== 0 ? d['F_float'] / (d['rho_liquid'] * d['g']) : null,
      'g': d => d['rho_liquid'] * d['V_disp'] !== 0 ? d['F_float'] / (d['rho_liquid'] * d['V_disp']) : null
    }
  });
  // 7. 杠杆平衡
  formulas.push({
    name: '杠杆平衡 F1*l1=F2*l2',
    variables: ['F1', 'l1', 'F2', 'l2'],
    solve: {
      'F1': d => d['l1'] !== 0 ? d['F2'] * d['l2'] / d['l1'] : null,
      'l1': d => d['F1'] !== 0 ? d['F2'] * d['l2'] / d['F1'] : null,
      'F2': d => d['l2'] !== 0 ? d['F1'] * d['l1'] / d['l2'] : null,
      'l2': d => d['F2'] !== 0 ? d['F1'] * d['l1'] / d['F2'] : null
    }
  });
  // 8. 滑轮组拉力
  formulas.push({
    name: '滑轮组拉力 F=(G动+G物)/n',
    variables: ['F', 'G_dyn', 'G_obj', 'n'],
    solve: {
      'F': d => d['n'] !== 0 ? (d['G_dyn'] + d['G_obj']) / d['n'] : null,
      'G_dyn': d => d['F'] * d['n'] - d['G_obj'],
      'G_obj': d => d['F'] * d['n'] - d['G_dyn'],
      'n': d => d['F'] !== 0 ? (d['G_dyn'] + d['G_obj']) / d['F'] : null
    }
  });
  // 9. 滑轮组距离
  formulas.push({
    name: '滑轮组距离 s绳=n*h升',
    variables: ['s_rope', 'n', 'h_lift'],
    solve: {
      's_rope': d => d['n'] * d['h_lift'],
      'n': d => d['h_lift'] !== 0 ? d['s_rope'] / d['h_lift'] : null,
      'h_lift': d => d['n'] !== 0 ? d['s_rope'] / d['n'] : null
    }
  });
  // 10. 功 W=Fs
  formulas.push({
    name: '功 W=F*s',
    variables: ['W', 'F', 's'],
    solve: {
      'W': d => d['F'] * d['s'],
      'F': d => d['s'] !== 0 ? d['W'] / d['s'] : null,
      's': d => d['F'] !== 0 ? d['W'] / d['F'] : null
    }
  });
  // 11. 功 W=Pt
  formulas.push({
    name: '功 W=P*t',
    variables: ['W', 'P', 't'],
    solve: {
      'W': d => d['P'] * d['t'],
      'P': d => d['t'] !== 0 ? d['W'] / d['t'] : null,
      't': d => d['P'] !== 0 ? d['W'] / d['P'] : null
    }
  });
  // 12. 功率 P=W/t
  formulas.push({
    name: '功率 P=W/t',
    variables: ['P', 'W', 't'],
    solve: {
      'P': d => d['t'] !== 0 ? d['W'] / d['t'] : null,
      'W': d => d['P'] * d['t'],
      't': d => d['P'] !== 0 ? d['W'] / d['P'] : null
    }
  });
  // 13. 功率 P=Fv
  formulas.push({
    name: '功率 P=F*v',
    variables: ['P', 'F', 'v'],
    solve: {
      'P': d => d['F'] * d['v'],
      'F': d => d['v'] !== 0 ? d['P'] / d['v'] : null,
      'v': d => d['F'] !== 0 ? d['P'] / d['F'] : null
    }
  });
  // 14. 机械效率
  formulas.push({
    name: '机械效率 η=W有/W总',
    variables: ['eta', 'W_useful', 'W_total'],
    solve: {
      'eta': d => d['W_total'] !== 0 ? d['W_useful'] / d['W_total'] : null,
      'W_useful': d => d['eta'] * d['W_total'],
      'W_total': d => d['eta'] !== 0 ? d['W_useful'] / d['eta'] : null
    }
  });
  // 15. 滑轮组机械效率
  formulas.push({
    name: '滑轮组机械效率 η=G物/(F*n)',
    variables: ['eta', 'G_obj', 'F', 'n'],
    solve: {
      'eta': d => d['F'] * d['n'] !== 0 ? d['G_obj'] / (d['F'] * d['n']) : null,
      'G_obj': d => d['eta'] * d['F'] * d['n'],
      'F': d => d['eta'] * d['n'] !== 0 ? d['G_obj'] / (d['eta'] * d['n']) : null,
      'n': d => d['eta'] * d['F'] !== 0 ? d['G_obj'] / (d['eta'] * d['F']) : null
    }
  });
  // 16. 吸放热
  formulas.push({
    name: '吸放热 Q=cmΔT',
    variables: ['Q', 'c', 'm', 'delta_t'],
    solve: {
      'Q': d => d['c'] * d['m'] * d['delta_t'],
      'c': d => d['m'] * d['delta_t'] !== 0 ? d['Q'] / (d['m'] * d['delta_t']) : null,
      'm': d => d['c'] * d['delta_t'] !== 0 ? d['Q'] / (d['c'] * d['delta_t']) : null,
      'delta_t': d => d['c'] * d['m'] !== 0 ? d['Q'] / (d['c'] * d['m']) : null
    }
  });
  // 17. 燃料放热
  formulas.push({
    name: '燃料放热 Q=m*q',
    variables: ['Q', 'm', 'q_fuel'],
    solve: {
      'Q': d => d['m'] * d['q_fuel'],
      'm': d => d['q_fuel'] !== 0 ? d['Q'] / d['q_fuel'] : null,
      'q_fuel': d => d['m'] !== 0 ? d['Q'] / d['m'] : null
    }
  });
  // 18. 欧姆定律
  formulas.push({
    name: '欧姆定律 I=U/R',
    variables: ['I', 'U', 'R'],
    solve: {
      'I': d => d['R'] !== 0 ? d['U'] / d['R'] : null,
      'U': d => d['I'] * d['R'],
      'R': d => d['I'] !== 0 ? d['U'] / d['I'] : null
    }
  });
  // 19. 电功
  formulas.push({
    name: '电功 W=UIt',
    variables: ['W', 'U', 'I', 't'],
    solve: {
      'W': d => d['U'] * d['I'] * d['t'],
      'U': d => d['I'] * d['t'] !== 0 ? d['W'] / (d['I'] * d['t']) : null,
      'I': d => d['U'] * d['t'] !== 0 ? d['W'] / (d['U'] * d['t']) : null,
      't': d => d['U'] * d['I'] !== 0 ? d['W'] / (d['U'] * d['I']) : null
    }
  });
  // 20. 电功率
  formulas.push({
    name: '电功率 P=UI',
    variables: ['P', 'U', 'I'],
    solve: {
      'P': d => d['U'] * d['I'],
      'U': d => d['I'] !== 0 ? d['P'] / d['I'] : null,
      'I': d => d['U'] !== 0 ? d['P'] / d['U'] : null
    }
  });
  // 21. 焦耳定律
  formulas.push({
    name: '焦耳定律 Q=I²Rt',
    variables: ['Q', 'I', 'R', 't'],
    solve: {
      'Q': d => d['I'] ** 2 * d['R'] * d['t'],
      'I': d => d['R'] * d['t'] > 0 ? Math.sqrt(d['Q'] / (d['R'] * d['t'])) : null,
      'R': d => d['I'] * d['t'] !== 0 ? d['Q'] / (d['I'] ** 2 * d['t']) : null,
      't': d => d['I'] * d['R'] !== 0 ? d['Q'] / (d['I'] ** 2 * d['R']) : null
    }
  });
  // 22. 凸透镜成像
  formulas.push({
    name: '凸透镜成像 1/f=1/u+1/v',
    variables: ['f_lens', 'u', 'v_image'],
    solve: {
      'f_lens': d => d['u'] * d['v_image'] !== 0 ? 1 / (1 / d['u'] + 1 / d['v_image']) : null,
      'u': d => d['f_lens'] * d['v_image'] !== 0 && (1 / d['f_lens'] - 1 / d['v_image']) !== 0 ? 1 / (1 / d['f_lens'] - 1 / d['v_image']) : null,
      'v_image': d => d['f_lens'] * d['u'] !== 0 && (1 / d['f_lens'] - 1 / d['u']) !== 0 ? 1 / (1 / d['f_lens'] - 1 / d['u']) : null
    }
  });
  // 23. 匀变速末速度
  formulas.push({
    name: '匀变速末速度 v=v0+at',
    variables: ['v', 'v0', 'a', 't'],
    solve: {
      'v': d => d['v0'] + d['a'] * d['t'],
      'v0': d => d['v'] - d['a'] * d['t'],
      'a': d => d['t'] !== 0 ? (d['v'] - d['v0']) / d['t'] : null,
      't': d => d['a'] !== 0 ? (d['v'] - d['v0']) / d['a'] : null
    }
  });
  // 24. 匀变速位移
  formulas.push({
    name: '匀变速位移 s=v0t+½at²',
    variables: ['s', 'v0', 't', 'a'],
    solve: {
      's': d => d['v0'] * d['t'] + 0.5 * d['a'] * d['t'] ** 2,
      'v0': d => d['t'] !== 0 ? (d['s'] - 0.5 * d['a'] * d['t'] ** 2) / d['t'] : null,
      'a': d => d['t'] !== 0 ? 2 * (d['s'] - d['v0'] * d['t']) / d['t'] ** 2 : null,
      't': () => null // 二次方程，与源程序一致暂不实现
    }
  });
  // 25. 速度位移关系
  formulas.push({
    name: '速度位移关系 v²-v0²=2as',
    variables: ['v', 'v0', 'a', 's'],
    solve: {
      'v': d => (d['v0'] ** 2 + 2 * d['a'] * d['s']) ** 0.5,
      'v0': d => (d['v'] ** 2 - 2 * d['a'] * d['s']) ** 0.5,
      'a': d => d['s'] !== 0 ? (d['v'] ** 2 - d['v0'] ** 2) / (2 * d['s']) : null,
      's': d => d['a'] !== 0 ? (d['v'] ** 2 - d['v0'] ** 2) / (2 * d['a']) : null
    }
  });
  // 26. 中间时刻速度
  formulas.push({
    name: '中间时刻速度 v中时=(v0+v)/2',
    variables: ['v_mid_t', 'v0', 'v'],
    solve: {
      'v_mid_t': d => (d['v0'] + d['v']) / 2,
      'v0': d => 2 * d['v_mid_t'] - d['v'],
      'v': d => 2 * d['v_mid_t'] - d['v0']
    }
  });
  // 27. 中间位置速度
  formulas.push({
    name: '中间位置速度 v中位=√((v0²+v²)/2)',
    variables: ['v_mid_s', 'v0', 'v'],
    solve: {
      'v_mid_s': d => ((d['v0'] ** 2 + d['v'] ** 2) / 2) ** 0.5,
      'v0': d => (2 * d['v_mid_s'] ** 2 - d['v'] ** 2) ** 0.5,
      'v': d => (2 * d['v_mid_s'] ** 2 - d['v0'] ** 2) ** 0.5
    }
  });
  // 28. 自由落体速度
  formulas.push({
    name: '自由落体速度 v=gt',
    variables: ['v', 'g', 't'],
    solve: {
      'v': d => d['g'] * d['t'],
      'g': d => d['t'] !== 0 ? d['v'] / d['t'] : null,
      't': d => d['g'] !== 0 ? d['v'] / d['g'] : null
    }
  });
  // 29. 自由落体高度
  formulas.push({
    name: '自由落体高度 h=½gt²',
    variables: ['h', 'g', 't'],
    solve: {
      'h': d => 0.5 * d['g'] * d['t'] ** 2,
      'g': d => d['t'] !== 0 ? 2 * d['h'] / d['t'] ** 2 : null,
      't': d => d['g'] !== 0 && 2 * d['h'] / d['g'] >= 0 ? (2 * d['h'] / d['g']) ** 0.5 : null
    }
  });
  // 30. 自由落体 v²=2gh
  formulas.push({
    name: '自由落体 v²=2gh',
    variables: ['v', 'g', 'h'],
    solve: {
      'v': d => (2 * d['g'] * d['h']) ** 0.5,
      'g': d => d['h'] !== 0 ? d['v'] ** 2 / (2 * d['h']) : null,
      'h': d => d['g'] !== 0 ? d['v'] ** 2 / (2 * d['g']) : null
    }
  });
  // 31. 竖直上抛位移
  formulas.push({
    name: '竖直上抛位移 s=v0t-½gt²',
    variables: ['s', 'v0', 't', 'g'],
    solve: {
      's': d => d['v0'] * d['t'] - 0.5 * d['g'] * d['t'] ** 2,
      'v0': d => d['t'] !== 0 ? (d['s'] + 0.5 * d['g'] * d['t'] ** 2) / d['t'] : null,
      'g': d => d['t'] !== 0 ? 2 * (d['v0'] * d['t'] - d['s']) / d['t'] ** 2 : null,
      't': () => null // 二次方程
    }
  });
  // 32. 竖直上抛最大高度
  formulas.push({
    name: '竖直上抛最大高度 h_max=v0²/(2g)',
    variables: ['h_max', 'v0', 'g'],
    solve: {
      'h_max': d => d['g'] !== 0 ? d['v0'] ** 2 / (2 * d['g']) : null,
      'v0': d => (2 * d['h_max'] * d['g']) ** 0.5,
      'g': d => d['h_max'] !== 0 ? d['v0'] ** 2 / (2 * d['h_max']) : null
    }
  });
  // 33. 竖直上抛往返时间
  formulas.push({
    name: '竖直上抛往返时间 t=2v0/g',
    variables: ['t_total', 'v0', 'g'],
    solve: {
      't_total': d => d['g'] !== 0 ? 2 * d['v0'] / d['g'] : null,
      'v0': d => d['t_total'] * d['g'] / 2,
      'g': d => d['t_total'] !== 0 ? 2 * d['v0'] / d['t_total'] : null
    }
  });
  // 34. 线速度
  formulas.push({
    name: '线速度 v=ωr',
    variables: ['v', 'omega', 'r'],
    solve: {
      'v': d => d['omega'] * d['r'],
      'omega': d => d['r'] !== 0 ? d['v'] / d['r'] : null,
      'r': d => d['omega'] !== 0 ? d['v'] / d['omega'] : null
    }
  });
  // 35. 角速度
  formulas.push({
    name: '角速度 ω=2π/T',
    variables: ['omega', 'T', 'pi'],
    solve: {
      'omega': d => d['T'] !== 0 ? 2 * d['pi'] / d['T'] : null,
      'T': d => d['omega'] !== 0 ? 2 * d['pi'] / d['omega'] : null
    }
  });
  // 36. 向心加速度
  formulas.push({
    name: '向心加速度 a_n=v²/r',
    variables: ['a_n', 'v', 'r'],
    solve: {
      'a_n': d => d['r'] !== 0 ? d['v'] ** 2 / d['r'] : null,
      'v': d => (d['a_n'] * d['r']) ** 0.5,
      'r': d => d['a_n'] !== 0 ? d['v'] ** 2 / d['a_n'] : null
    }
  });
  // 37. 向心力
  formulas.push({
    name: '向心力 F_n=mv²/r',
    variables: ['F_n', 'm', 'v', 'r'],
    solve: {
      'F_n': d => d['r'] !== 0 ? d['m'] * d['v'] ** 2 / d['r'] : null,
      'm': d => d['v'] !== 0 ? d['F_n'] * d['r'] / d['v'] ** 2 : null,
      'v': d => d['m'] !== 0 && d['F_n'] * d['r'] / d['m'] >= 0 ? (d['F_n'] * d['r'] / d['m']) ** 0.5 : null,
      'r': d => d['F_n'] !== 0 ? d['m'] * d['v'] ** 2 / d['F_n'] : null
    }
  });
  // 38. 平抛水平位移
  formulas.push({
    name: '平抛水平位移 x=v0t',
    variables: ['x', 'v0', 't'],
    solve: {
      'x': d => d['v0'] * d['t'],
      'v0': d => d['t'] !== 0 ? d['x'] / d['t'] : null,
      't': d => d['v0'] !== 0 ? d['x'] / d['v0'] : null
    }
  });
  // 39. 平抛竖直位移
  formulas.push({
    name: '平抛竖直位移 y=½gt²',
    variables: ['y', 'g', 't'],
    solve: {
      'y': d => 0.5 * d['g'] * d['t'] ** 2,
      'g': d => d['t'] !== 0 ? 2 * d['y'] / d['t'] ** 2 : null,
      't': d => d['g'] !== 0 && 2 * d['y'] / d['g'] >= 0 ? (2 * d['y'] / d['g']) ** 0.5 : null
    }
  });
  // 40. 平抛竖直分速度
  formulas.push({
    name: '平抛竖直分速度 vy=gt',
    variables: ['vy', 'g', 't'],
    solve: {
      'vy': d => d['g'] * d['t'],
      'g': d => d['t'] !== 0 ? d['vy'] / d['t'] : null,
      't': d => d['g'] !== 0 ? d['vy'] / d['g'] : null
    }
  });
  // 41. 平抛合速度
  formulas.push({
    name: '平抛合速度 v=√(vx²+vy²)',
    variables: ['v', 'vx', 'vy'],
    solve: {
      'v': d => (d['vx'] ** 2 + d['vy'] ** 2) ** 0.5,
      'vx': d => (d['v'] ** 2 - d['vy'] ** 2) ** 0.5,
      'vy': d => (d['v'] ** 2 - d['vx'] ** 2) ** 0.5
    }
  });
  // 42. 单摆周期
  formulas.push({
    name: '单摆周期 T=2π√(l/g)',
    variables: ['T', 'l', 'g', 'pi'],
    solve: {
      'T': d => d['g'] !== 0 && d['l'] / d['g'] >= 0 ? 2 * d['pi'] * (d['l'] / d['g']) ** 0.5 : null,
      'l': d => (d['T'] / (2 * d['pi'])) ** 2 * d['g'],
      'g': d => d['T'] !== 0 ? (2 * d['pi'] / d['T']) ** 2 * d['l'] : null
    }
  });
  // 43. 牛顿第二定律
  formulas.push({
    name: '牛顿第二定律 F=ma',
    variables: ['F', 'm', 'a'],
    solve: {
      'F': d => d['m'] * d['a'],
      'm': d => d['a'] !== 0 ? d['F'] / d['a'] : null,
      'a': d => d['m'] !== 0 ? d['F'] / d['m'] : null
    }
  });
  // 44. 胡克定律
  formulas.push({
    name: '胡克定律 F=kx',
    variables: ['F', 'k', 'x_spring'],
    solve: {
      'F': d => d['k'] * d['x_spring'],
      'k': d => d['x_spring'] !== 0 ? d['F'] / d['x_spring'] : null,
      'x_spring': d => d['k'] !== 0 ? d['F'] / d['k'] : null
    }
  });
  // 45. 滑动摩擦力
  formulas.push({
    name: '滑动摩擦力 f=μN',
    variables: ['F', 'mu', 'N'],
    solve: {
      'F': d => d['mu'] * d['N'],
      'mu': d => d['N'] !== 0 ? d['F'] / d['N'] : null,
      'N': d => d['mu'] !== 0 ? d['F'] / d['mu'] : null
    }
  });
  // 46. 万有引力
  formulas.push({
    name: '万有引力 F=Gm1m2/r²',
    variables: ['F', 'G_const', 'm1', 'm2', 'r_dist'],
    solve: {
      'F': d => d['r_dist'] !== 0 ? d['G_const'] * d['m1'] * d['m2'] / d['r_dist'] ** 2 : null,
      'm1': d => d['G_const'] * d['m2'] !== 0 ? d['F'] * d['r_dist'] ** 2 / (d['G_const'] * d['m2']) : null,
      'm2': d => d['G_const'] * d['m1'] !== 0 ? d['F'] * d['r_dist'] ** 2 / (d['G_const'] * d['m1']) : null,
      'r_dist': d => d['F'] !== 0 ? (d['G_const'] * d['m1'] * d['m2'] / d['F']) ** 0.5 : null
    }
  });
  // 47. 动能
  formulas.push({
    name: '动能 Ek=½mv²',
    variables: ['Ek', 'm', 'v'],
    solve: {
      'Ek': d => 0.5 * d['m'] * d['v'] ** 2,
      'm': d => d['v'] !== 0 ? 2 * d['Ek'] / d['v'] ** 2 : null,
      'v': d => d['m'] !== 0 && 2 * d['Ek'] / d['m'] >= 0 ? (2 * d['Ek'] / d['m']) ** 0.5 : null
    }
  });
  // 48. 重力势能
  formulas.push({
    name: '重力势能 Ep=mgh',
    variables: ['Ep', 'm', 'g', 'h'],
    solve: {
      'Ep': d => d['m'] * d['g'] * d['h'],
      'm': d => d['g'] * d['h'] !== 0 ? d['Ep'] / (d['g'] * d['h']) : null,
      'h': d => d['m'] * d['g'] !== 0 ? d['Ep'] / (d['m'] * d['g']) : null,
      'g': d => d['m'] * d['h'] !== 0 ? d['Ep'] / (d['m'] * d['h']) : null
    }
  });
  // 49. 弹性势能
  formulas.push({
    name: '弹性势能 Ep=½kx²',
    variables: ['Ep_spring', 'k', 'x_spring'],
    solve: {
      'Ep_spring': d => 0.5 * d['k'] * d['x_spring'] ** 2,
      'k': d => d['x_spring'] !== 0 ? 2 * d['Ep_spring'] / d['x_spring'] ** 2 : null,
      'x_spring': d => d['k'] !== 0 ? (2 * d['Ep_spring'] / d['k']) ** 0.5 : null
    }
  });
  // 50. 动能定理
  formulas.push({
    name: '动能定理 W=½m(v²-v0²)',
    variables: ['W', 'm', 'v', 'v0'],
    solve: {
      'W': d => 0.5 * d['m'] * (d['v'] ** 2 - d['v0'] ** 2),
      'm': d => d['v'] ** 2 - d['v0'] ** 2 !== 0 ? 2 * d['W'] / (d['v'] ** 2 - d['v0'] ** 2) : null,
      'v': d => d['m'] !== 0 && d['v0'] ** 2 + 2 * d['W'] / d['m'] >= 0 ? (d['v0'] ** 2 + 2 * d['W'] / d['m']) ** 0.5 : null,
      'v0': d => d['m'] !== 0 && d['v'] ** 2 - 2 * d['W'] / d['m'] >= 0 ? (d['v'] ** 2 - 2 * d['W'] / d['m']) ** 0.5 : null
    }
  });
  // 51. 动量定理
  formulas.push({
    name: '动量定理 Ft=m(v-v0)',
    variables: ['Ft', 'm', 'v', 'v0'],
    solve: {
      'Ft': d => d['m'] * (d['v'] - d['v0']),
      'm': d => d['v'] - d['v0'] !== 0 ? d['Ft'] / (d['v'] - d['v0']) : null,
      'v': d => d['m'] !== 0 ? d['v0'] + d['Ft'] / d['m'] : null,
      'v0': d => d['m'] !== 0 ? d['v'] - d['Ft'] / d['m'] : null
    }
  });
  // 52. 库仑定律
  formulas.push({
    name: '库仑定律 F=kq1q2/r²',
    variables: ['F', 'k_coulomb', 'q1', 'q2', 'r_dist'],
    solve: {
      'F': d => d['r_dist'] !== 0 ? d['k_coulomb'] * d['q1'] * d['q2'] / d['r_dist'] ** 2 : null,
      'q1': d => d['k_coulomb'] * d['q2'] !== 0 ? d['F'] * d['r_dist'] ** 2 / (d['k_coulomb'] * d['q2']) : null,
      'q2': d => d['k_coulomb'] * d['q1'] !== 0 ? d['F'] * d['r_dist'] ** 2 / (d['k_coulomb'] * d['q1']) : null,
      'r_dist': d => d['F'] !== 0 ? (d['k_coulomb'] * d['q1'] * d['q2'] / d['F']) ** 0.5 : null
    }
  });
  // 53. 电场强度
  formulas.push({
    name: '电场强度 E=F/q',
    variables: ['E_field', 'F', 'q'],
    solve: {
      'E_field': d => d['q'] !== 0 ? d['F'] / d['q'] : null,
      'F': d => d['E_field'] * d['q'],
      'q': d => d['E_field'] !== 0 ? d['F'] / d['E_field'] : null
    }
  });
  // 54. 电场力做功
  formulas.push({
    name: '电场力做功 W=qU',
    variables: ['W', 'q', 'U_ab'],
    solve: {
      'W': d => d['q'] * d['U_ab'],
      'q': d => d['U_ab'] !== 0 ? d['W'] / d['U_ab'] : null,
      'U_ab': d => d['q'] !== 0 ? d['W'] / d['q'] : null
    }
  });
  // 55. 电流定义
  formulas.push({
    name: '电流定义 I=q/t',
    variables: ['I', 'q', 't'],
    solve: {
      'I': d => d['t'] !== 0 ? d['q'] / d['t'] : null,
      'q': d => d['I'] * d['t'],
      't': d => d['I'] !== 0 ? d['q'] / d['I'] : null
    }
  });
  // 56. 安培力
  formulas.push({
    name: '安培力 F=BIL',
    variables: ['F', 'B', 'I', 'L'],
    solve: {
      'F': d => d['B'] * d['I'] * d['L'],
      'B': d => d['I'] * d['L'] !== 0 ? d['F'] / (d['I'] * d['L']) : null,
      'I': d => d['B'] * d['L'] !== 0 ? d['F'] / (d['B'] * d['L']) : null,
      'L': d => d['B'] * d['I'] !== 0 ? d['F'] / (d['B'] * d['I']) : null
    }
  });
  // 57. 洛伦兹力
  formulas.push({
    name: '洛伦兹力 f=qvB',
    variables: ['f_L', 'q', 'v', 'B'],
    solve: {
      'f_L': d => d['q'] * d['v'] * d['B'],
      'q': d => d['v'] * d['B'] !== 0 ? d['f_L'] / (d['v'] * d['B']) : null,
      'v': d => d['q'] * d['B'] !== 0 ? d['f_L'] / (d['q'] * d['B']) : null,
      'B': d => d['q'] * d['v'] !== 0 ? d['f_L'] / (d['q'] * d['v']) : null
    }
  });
  // 58. 法拉第电磁感应
  formulas.push({
    name: '法拉第电磁感应 E=nΔΦ/Δt',
    variables: ['E_ind', 'n_coil', 'delta_phi', 'delta_t_time'],
    solve: {
      'E_ind': d => d['delta_t_time'] !== 0 ? d['n_coil'] * d['delta_phi'] / d['delta_t_time'] : null,
      'n_coil': d => d['delta_phi'] !== 0 ? d['E_ind'] * d['delta_t_time'] / d['delta_phi'] : null,
      'delta_phi': d => d['n_coil'] !== 0 ? d['E_ind'] * d['delta_t_time'] / d['n_coil'] : null,
      'delta_t_time': d => d['E_ind'] !== 0 ? d['n_coil'] * d['delta_phi'] / d['E_ind'] : null
    }
  });
  // 59. 切割磁感线
  formulas.push({
    name: '切割磁感线 E=BLv',
    variables: ['E_ind', 'B', 'L', 'v'],
    solve: {
      'E_ind': d => d['B'] * d['L'] * d['v'],
      'B': d => d['L'] * d['v'] !== 0 ? d['E_ind'] / (d['L'] * d['v']) : null,
      'L': d => d['B'] * d['v'] !== 0 ? d['E_ind'] / (d['B'] * d['v']) : null,
      'v': d => d['B'] * d['L'] !== 0 ? d['E_ind'] / (d['B'] * d['L']) : null
    }
  });
  // 60. 玻意耳定律
  formulas.push({
    name: '玻意耳定律 p1V1=p2V2',
    variables: ['p1', 'V1', 'p2', 'V2'],
    solve: {
      'p1': d => d['V1'] !== 0 ? d['p2'] * d['V2'] / d['V1'] : null,
      'V1': d => d['p1'] !== 0 ? d['p2'] * d['V2'] / d['p1'] : null,
      'p2': d => d['V2'] !== 0 ? d['p1'] * d['V1'] / d['V2'] : null,
      'V2': d => d['p2'] !== 0 ? d['p1'] * d['V1'] / d['p2'] : null
    }
  });
  // 61. 盖·吕萨克定律
  formulas.push({
    name: '盖·吕萨克定律 V1/T1=V2/T2',
    variables: ['V1', 'T1', 'V2', 'T2'],
    solve: {
      'V1': d => d['T2'] !== 0 ? d['V2'] * d['T1'] / d['T2'] : null,
      'T1': d => d['V2'] !== 0 ? d['V1'] * d['T2'] / d['V2'] : null,
      'V2': d => d['T1'] !== 0 ? d['V1'] * d['T2'] / d['T1'] : null,
      'T2': d => d['V1'] !== 0 ? d['V2'] * d['T1'] / d['V1'] : null
    }
  });
  // 62. 理想气体状态方程
  formulas.push({
    name: '理想气体 pV=(m/μ)RT',
    variables: ['p', 'V', 'm', 'mu', 'R_gas', 'T'],
    solve: {
      'p': d => d['mu'] * d['V'] !== 0 ? d['m'] * d['R_gas'] * d['T'] / (d['mu'] * d['V']) : null,
      'V': d => d['mu'] * d['p'] !== 0 ? d['m'] * d['R_gas'] * d['T'] / (d['mu'] * d['p']) : null,
      'm': d => d['R_gas'] * d['T'] !== 0 ? d['p'] * d['V'] * d['mu'] / (d['R_gas'] * d['T']) : null,
      'mu': d => d['p'] * d['V'] !== 0 ? d['m'] * d['R_gas'] * d['T'] / (d['p'] * d['V']) : null,
      'T': d => d['m'] * d['R_gas'] !== 0 ? d['p'] * d['V'] * d['mu'] / (d['m'] * d['R_gas']) : null
    }
  });
  // 63. 波速
  formulas.push({
    name: '波速 v=λf',
    variables: ['v_wave', 'lambda', 'f'],
    solve: {
      'v_wave': d => d['lambda'] * d['f'],
      'lambda': d => d['f'] !== 0 ? d['v_wave'] / d['f'] : null,
      'f': d => d['lambda'] !== 0 ? d['v_wave'] / d['lambda'] : null
    }
  });
  // 64. 质能方程
  formulas.push({
    name: '质能方程 E=mc²',
    variables: ['E_mc', 'm', 'c_light'],
    solve: {
      'E_mc': d => d['m'] * d['c_light'] ** 2,
      'm': d => d['c_light'] !== 0 ? d['E_mc'] / d['c_light'] ** 2 : null
    }
  });

  /* ==================== 四、公式表数据（整理自 物理公式表.py 的 PHYSICS_TEXT） ==================== */
  const FORMULA_TABLE = [
    {
      category: '一、初中物理 · 力学',
      entries: [
        { name: '速度公式', content: 'v=s/t　变形：s=vt，t=s/v\n单位换算：1 m/s = 3.6 km/h　声速在空气中：340 m/s' },
        { name: '密度公式', content: 'ρ=m/V　水的密度：1.0×10³ kg/m³\n单位换算：1 g/cm³ = 1000 kg/m³' },
        { name: '重力公式', content: 'G=mg　g 通常取 9.8 N/kg，题目未交待时取 10 N/kg' },
        { name: '压强公式（普适）', content: 'p=F/S　固体平放时 F=G=mg\n1 Pa = 1 N/m²　1 标准大气压 = 76 cmHg 柱 = 1.01×10⁵ Pa' },
        { name: '液体压强公式', content: 'p=ρgh　液体压力：F=pS=ρghS' },
        { name: '杠杆平衡条件', content: 'F₁l₁=F₂l₂' },
        { name: '滑轮组公式', content: '不计绳重和摩擦时：F=(G动+G物)/n，s=nh\n动滑轮：F=½(G动+G物)，s=2h' },
        { name: '功的公式', content: 'W=Fs　举高物体时 W=Gh=mgh　W=Pt' },
        { name: '功率公式', content: 'P=W/t　P=Fv' },
        { name: '机械效率公式', content: 'η=W有/W总　η=P有/P总\n滑轮组中（竖直方向）：η=G/(Fn)' }
      ]
    },
    {
      category: '一、初中物理 · 热学',
      entries: [
        { name: '吸热公式', content: 'Q吸=cm(t−t₀)=cmΔt' },
        { name: '放热公式', content: 'Q放=cm(t₀−t)=cmΔt\n水的比热容：4.2×10³ J/(kg·℃)' },
        { name: '燃料燃烧放热', content: 'Q放=mq　或　Q放=Vq' },
        { name: '热平衡方程', content: 'Q放=Q吸' },
        { name: '热力学温度', content: 'T=t+273 K' }
      ]
    },
    {
      category: '一、初中物理 · 电学',
      entries: [
        { name: '欧姆定律', content: 'I=U/R　变形：U=IR，R=U/I' },
        { name: '电功公式', content: 'W=UIt' },
        { name: '电功率公式', content: 'P=UI' },
        { name: '焦耳定律', content: 'Q=I²Rt' }
      ]
    },
    {
      category: '一、初中物理 · 光学',
      entries: [
        { name: '凸透镜成像公式', content: '1/f = 1/u + 1/v' }
      ]
    },
    {
      category: '二、高中物理 · 运动学',
      entries: [
        { name: '匀变速直线运动', content: '平均速度：v̄=s/t（定义式）　末速度：v_t=v₀+at\n位移：s=v₀t+½at²　推论：v_t²−v₀²=2as\n中间时刻速度：v(t/2)=v̄=(v₀+v_t)/2\n中间位置速度：v(s/2)=√((v₀²+v_t²)/2)\n实验推论：Δs=aT²（相邻等时间间隔位移差）' },
        { name: '自由落体运动', content: '末速度：v_t=gt　下落高度：h=½gt²\n速度位移关系：v_t²=2gh' },
        { name: '竖直上抛运动', content: '位移：s=v₀t−½gt²\n上升最大高度：h_max=v₀²/(2g)\n往返时间：t=2v₀/g' },
        { name: '匀速圆周运动', content: '线速度：v=s/t=2πr/T=ωr　角速度：ω=2π/T=2πf\n向心加速度：a_n=v²/r=ω²r=vω=4π²r/T²\n向心力：F_n=mv²/r=mω²r' },
        { name: '平抛运动', content: '水平：x=v₀t，v_x=v₀　竖直：y=½gt²，v_y=gt\n合速度：v=√(v_x²+v_y²)' },
        { name: '单摆周期', content: 'T=2π√(l/g)（摆角 θ<5°）' }
      ]
    },
    {
      category: '二、高中物理 · 力学',
      entries: [
        { name: '牛顿第二定律', content: 'F合=ma' },
        { name: '重力', content: 'G=mg' },
        { name: '胡克定律（弹力）', content: 'F=kx（x 为伸长量或压缩量）' },
        { name: '摩擦力', content: '静摩擦力：0≤f_s≤f_s,max\n滑动摩擦力：f_k=μ_k·N' },
        { name: '力的合成', content: '同方向：F=F₁+F₂　反方向：F=F₁−F₂（F₁>F₂）\n合力范围：|F₁−F₂|≤F≤F₁+F₂' },
        { name: '万有引力', content: 'F=G·m₁m₂/r²' }
      ]
    },
    {
      category: '二、高中物理 · 功和能',
      entries: [
        { name: '功', content: 'W=Fs·cosα（定义式）　重力做功：W_ab=mgh_ab' },
        { name: '功率', content: 'P=W/t（定义式，求平均功率）' },
        { name: '动能', content: 'E_k=½mv²' },
        { name: '重力势能', content: 'E_p=mgh' },
        { name: '弹性势能', content: 'E_p=½kx²' },
        { name: '动能定理', content: 'W合=ΔE_k=½mv_t²−½mv₀²' },
        { name: '机械能守恒定律', content: 'E_k1+E_p1=E_k2+E_p2' }
      ]
    },
    {
      category: '二、高中物理 · 动量',
      entries: [
        { name: '动量定理', content: 'I=Δp　或　Ft=mv_t−mv₀' },
        { name: '动量守恒定律', content: "m₁v₁+m₂v₂=m₁v₁'+m₂v₂'" }
      ]
    },
    {
      category: '二、高中物理 · 电场',
      entries: [
        { name: '库仑定律', content: 'F=kq₁q₂/r²' },
        { name: '电场强度', content: 'E=F/q' },
        { name: '电势能', content: 'E_A=qφ_A' },
        { name: '电场力做功', content: 'W=qU' }
      ]
    },
    {
      category: '二、高中物理 · 电路',
      entries: [
        { name: '电流强度', content: 'I=q/t' },
        { name: '欧姆定律', content: 'I=U/R' },
        { name: '电功（普适式）', content: 'W=UIt' },
        { name: '电功率（普适式）', content: 'P=UI' },
        { name: '焦耳定律', content: 'Q=I²Rt' }
      ]
    },
    {
      category: '二、高中物理 · 磁场',
      entries: [
        { name: '安培力', content: 'F=BIL（B⊥I）' },
        { name: '洛伦兹力', content: 'f=qvB（v⊥B）' }
      ]
    },
    {
      category: '二、高中物理 · 电磁感应',
      entries: [
        { name: '法拉第电磁感应定律', content: 'E=nΔΦ/Δt（普适公式）' },
        { name: '切割磁感线运动', content: 'E=BLv（B⊥L，L⊥v）' }
      ]
    },
    {
      category: '二、高中物理 · 热学',
      entries: [
        { name: '玻意耳定律（等温）', content: 'p₁V₁=p₂V₂' },
        { name: '盖·吕萨克定律（等压）', content: 'V_t=V₀(1+t/273)' },
        { name: '理想气体状态方程', content: 'pV=(m/μ)RT（克拉珀龙方程）' }
      ]
    },
    {
      category: '二、高中物理 · 振动与波',
      entries: [
        { name: '波速', content: 'v=s/t=λf=λ/T' }
      ]
    },
    {
      category: '二、高中物理 · 近代物理',
      entries: [
        { name: '质能方程', content: 'E=mc²' }
      ]
    },
    {
      category: '三、常用物理常数',
      entries: [
        { name: '真空中光速', content: '3×10⁸ m/s' },
        { name: '声音在空气中速度', content: '340 m/s' },
        { name: '水的密度', content: '1.0×10³ kg/m³' },
        { name: '水的比热容', content: '4.2×10³ J/(kg·℃)' },
        { name: '重力常数 g', content: '9.8 N/kg（常取 10 N/kg）' },
        { name: '标准大气压', content: '1.01×10⁵ Pa' },
        { name: '冰水混合物温度 / 冰的熔点', content: '0℃' },
        { name: '标准大气压下水的沸点', content: '100℃' },
        { name: '一节干电池电压', content: '1.5 V' },
        { name: '一节蓄电池电压', content: '2 V' },
        { name: '家庭电路电压', content: '220 V' },
        { name: '对人体安全电压', content: '不高于 36 V' }
      ]
    }
  ];

  /* ==================== 五、辅助函数 ==================== */
  function formatVar(v) {
    const info = VAR_INFO[v];
    if (!info) return v;
    return info[1] ? `${info[0]} (${v})` : v;
  }

  function parseUserInput(text) {
    text = (text || '').trim();
    if (!text) return {};
    for (const sep of [',', ';', '，', '；']) {
      text = text.split(sep).join(' ');
    }
    const pattern = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
    const result = {};
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const val = parseFloat(match[2]);
      if (!isNaN(val)) result[match[1]] = val;
    }
    return result;
  }

  /* ==================== 六、BFS 推导引擎（移植自源程序 derive_paths） ==================== */
  function derivePaths(knownDict, target, maxSteps = 10) {
    const initial = Object.assign({}, DEFAULT_CONSTANTS, knownDict);

    if (target in initial) {
      return { solutions: [[]], missingHint: new Set() };
    }

    const queue = [{ dict: initial, path: [] }];
    let head = 0;
    const visited = new Map();
    visited.set(Object.keys(initial).sort().join('|'), 0);

    const solutions = [];
    let shortestDepth = null;
    const missingCandidates = new Set();

    while (head < queue.length) {
      const { dict: currDict, path } = queue[head++];
      const depth = path.length;

      if (shortestDepth !== null && depth >= shortestDepth) {
        if (target in currDict && depth === shortestDepth) solutions.push(path);
        continue;
      }

      if (target in currDict) {
        if (shortestDepth === null) shortestDepth = depth;
        if (depth === shortestDepth) solutions.push(path);
        continue;
      }

      for (const formula of formulas) {
        const variables = formula.variables;
        const unknown = variables.filter(v => !(v in currDict));
        if (unknown.length === 1) {
          const varToCompute = unknown[0];
          const inputDict = {};
          for (const v of variables) {
            if (v !== varToCompute) inputDict[v] = currDict[v];
          }
          let value;
          try {
            value = formula.solve[varToCompute](inputDict);
          } catch (e) {
            continue;
          }
          if (value === null || value === undefined || typeof value !== 'number' || !isFinite(value)) continue;

          const newDict = Object.assign({}, currDict);
          newDict[varToCompute] = value;
          const newPath = path.concat([[formula.name, varToCompute, value]]);
          const newKey = Object.keys(newDict).sort().join('|');
          const newDepth = depth + 1;
          if (newDepth > maxSteps) continue;
          if (visited.has(newKey) && visited.get(newKey) <= newDepth) continue;
          visited.set(newKey, newDepth);
          queue.push({ dict: newDict, path: newPath });
        } else {
          if (variables.includes(target)) {
            unknown.forEach(v => missingCandidates.add(v));
          }
        }
      }
    }

    if (solutions.length === 0) {
      const directMissing = new Set();
      for (const formula of formulas) {
        if (formula.variables.includes(target)) {
          for (const v of formula.variables) {
            if (v !== target && !(v in initial)) directMissing.add(v);
          }
        }
      }
      const missingHint = directMissing.size > 0 ? directMissing : missingCandidates;
      return { solutions: [], missingHint };
    }
    return { solutions, missingHint: new Set() };
  }

  /* ==================== 七、导出 ==================== */
  global.Physics = {
    VAR_INFO,
    DEFAULT_CONSTANTS,
    formulas,
    FORMULA_TABLE,
    formatVar,
    parseUserInput,
    derivePaths
  };
})(typeof window !== 'undefined' ? window : globalThis);
