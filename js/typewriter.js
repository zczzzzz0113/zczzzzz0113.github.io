/* 首页打字机副标题驱动脚本
 * 通过主题的 inject.head 注入，位于 #swup 容器之外，全站常驻。
 * 主题使用 swup 4.3.1 做无刷新切页（事件名是 swup:*，不是 pjax:*），
 * SwupScriptsPlugin 未启用，所以切页时内联脚本不会重跑——
 * 因此本脚本必须常驻并监听 swup:page:view 来在切回首页时重播动画。 */
(function () {
  var INITED_EL = null; // 当前正在跑循环的节点，防止同一节点重复初始化

  function init() {
    var el = document.getElementById('cl-type-text');
    var line = document.getElementById('cl-type-line');
    var cursor = document.getElementById('cl-cursor');
    if (!el || !line || !cursor) return;
    if (INITED_EL === el) return;   // 同一节点已在跑
    INITED_EL = el;

    // 运行令牌：每次 init 递增，旧循环的 setTimeout 醒来发现令牌变了（或节点已离文档）就自灭，
    // 避免被 swup 换掉的旧节点上的循环永久空转 / 内存泄漏
    var RUN = window.__clTypeRun = (window.__clTypeRun || 0) + 1;
    function alive() { return window.__clTypeRun === RUN && document.contains(el); }
    function schedule(fn, ms) {
      setTimeout(function () { if (alive()) fn(); }, ms);
    }

    var LINES = [
      { t: "Sic Parvis Magna" },
      { t: "微末肇基，乃成巍峨" },
      { t: "From Humble Seeds, Greatness Springs" },
      { t: "Des Petits Riens Naît la Grandeur" },
      { t: "De lo Ínfimo Surge lo Sublime" },
      { t: "Aus Kleinem Keimt Erhabenes" },
      { t: "Dall'Umile Principio, L'Eccelsa Meta" },
      { t: "大いなるものは、小さきより生まれる" },
      { t: "Величие Рождается из Праха" },
      { t: "مِنَ الصِّغَارِ تَنْبُتُ الْعَظَمَة", rtl: true }
    ];
    var BASE_MS = 95;      // 基准打字间隔（约 16 字符时）
    var FAST_MS = 55;      // 长句加速下限
    var ERASE_MS = 26;     // 退格间隔（较快）
    var HOLD_MS = 2200;    // 整句停留
    var GAP_MS = 450;      // 清空到下一句的停顿

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return; // 减弱动效：保持静态首句
    }

    var idx = 0;

    // 长句打字更快：按长度在 BASE_MS 与 FAST_MS 之间取值
    function typeDelay(s) {
      return Math.max(FAST_MS, Math.min(BASE_MS, Math.round(1520 / Math.max(s.length, 1))));
    }

    function hold() {
      cursor.classList.add('cl-cursor--idle');
      schedule(next, HOLD_MS);
    }
    function next() {
      idx = (idx + 1) % LINES.length;
      erase();
    }
    function erase() {
      var s = el.textContent;
      if (s.length > 0) {
        el.textContent = s.slice(0, -1);
        schedule(erase, ERASE_MS);
      } else {
        schedule(typeLine, GAP_MS);
      }
    }
    function typeLine() {
      cursor.classList.remove('cl-cursor--idle');
      var item = LINES[idx], s = item.t, k = 0;
      // 阿拉伯语等 RTL 文案：整行切换书写方向，
      // 文字靠右、光标居左随打字向左移动，与 LTR 镜像
      line.setAttribute('dir', item.rtl ? 'rtl' : 'ltr');
      var d = typeDelay(s);
      (function step() {
        if (k <= s.length) {
          el.textContent = s.slice(0, k);
          k += 1;
          schedule(step, d);
        } else {
          hold();
        }
      })();
    }

    el.textContent = '';
    schedule(typeLine, 800);   // 等标题入场后再开始打字
  }

  // 首次加载（defer 脚本在 DOM 解析完后执行，此时节点已存在）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // 主题 swup 4.3.1 切页返回首页时重播（事件挂在 document 上）
  document.addEventListener('swup:page:view', init);
})();
