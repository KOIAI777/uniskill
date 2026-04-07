---
name: wjx-auto-fill
nameZh: 问卷星自动填写
description: Automate WJX (wjx.cn) questionnaire filling with Playwright — DOM analysis, question type templates, and post-submit retry state machine for batch survey completion
descriptionZh: 自动化填写问卷星（wjx.cn）问卷。包含完整接新问卷分析流程、DOM 调试脚本、题型填写模板、提交后循环弹窗状态机。适用于批量填写问卷、自动填写表单等场景。
category: research
schools: [bnbu]
tags: [wjx, questionnaire, automation, playwright, survey, batch-fill]
featured: false
version: 1.0.0
---

# 问卷星自动化填写

## 快速概览

```
Step 0: 手动预览问卷          → 记录题型组合
Step 1: analyze_wjx.py "URL"   → 完整分析 DOM（必跑）
Step 2: 建立 RATE_OFFSETS      → 映射表，逐个验证
Step 3: 填写逻辑               → 题型代码
Step 4: submit_with_retry()    → 循环弹窗状态机
Step 5: 批量运行
```

---

## 核心原则（6条，按重要性排序）

1. **提交后必须进入循环检测**：问卷星提交后触发弹窗/刷新/再次提交，最多循环 3 轮，**不能只点一次提交**
2. **用 JS 注入优于 Playwright API**：选项是隐藏的 `<input>`，必须通过 `page.evaluate()` 执行 JS
3. **弹窗按钮用精确匹配**：`el.innerText.trim() === '确认'`，**禁止**用 `indexOf('确认')` 匹配整页正文
4. **父容器长度限制**：`innerText.length < 1200` 排除问卷整页容器，只匹配弹窗小容器
5. **每次点完按钮后必须 `sleep` + `continue`**：等弹窗动画关闭，重新进入状态检测循环
6. **点「确认」≠ 提交**：确认只关闭弹窗恢复草稿，必须显式再次点击 `#ctlNext`

---

## 问卷星页面结构速查

### 题型与 DOM 对照

| 题型 | 隐藏 Input | 可见点击目标 | JS 赋值方式 |
|------|-----------|-------------|-----------|
| 单选题 | `input[type=radio][name=qN]` | `.jqradio`（需通过 `.jqradiowrapper` 定位） | `inp.checked=true; dispatchEvent('change')` |
| 多选题 | `input[type=checkbox]` | `.jqcheck` | 同上 |
| 矩阵量表 | `input[type=radio]`（每个选项一个） | `.rate-off`（按索引顺序排列） | `ros[idx].click()` |
| 数字/文本 | `input[type=tel/text/number]` | 直接可见 | `el.value=...; dispatchEvent('input')` |
| 提交按钮 | — | `#ctlNext`（最可靠） | `btn.click()` |

### 调试步骤（必须按顺序）

```
Step 0: 手动预览问卷 → 了解题型组合（量表/单选/矩阵/文本）
Step 1: python3 -u debug_wjx.py        # 完整分析问卷 DOM 结构
Step 2: 建立 RATE_OFFSETS 映射表         # 最关键步骤
Step 3: 逐题手动测试点击               # 确认 .rate-off / .jqradio 可点击
Step 4: 写 fill_questionnaire()        # 填完所有题
Step 5: python3 -u script.py --copies 1   # 单次端到端，观察弹窗类型
Step 6: 实现 submit_with_retry()           # 复制状态机代码
Step 7: python3 -u script.py --copies 5  # 5份测试
Step 8: 正式批量运行
```

---

## 接新问卷完整分析流程（Step 0 → Step 2 详解）

### Step 0：手动预览（必做）

不要一上来就写代码。先在浏览器里打开问卷，手动翻一遍：

- 有哪些题型组合？（量表题 / 单选 / 多选 / 矩阵量表 / 数字输入）
- 矩阵量表有多少行？每行几个选项？（1-5？1-7？）
- 有没有特殊量表？（NHI/TA 这种多题一组的量表）
- 提交按钮在哪里？提交后出现什么弹窗？

**记录下来，作为建立 offset 映射的依据。**

### Step 1：完整分析脚本（最核心工具）

这个脚本是接新问卷的**唯一入口**，必须跑通后才能写填写逻辑：

```python
#!/usr/bin/env python3
"""
问卷星完整分析脚本 - 接新问卷时必跑
用法: python3 -u analyze_wjx.py "https://v.wjx.cn/vm/XXXX.aspx"
"""
import sys
from playwright.sync_api import sync_playwright
import json, time

url = sys.argv[1] if len(sys.argv) > 1 else input("请输入问卷URL: ")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)

    # ===== 第一部分：全局元素统计 =====
    stats = page.evaluate("""
    (function() {
        var all = {
            jqradio: document.querySelectorAll('.jqradio').length,
            jqcheck: document.querySelectorAll('.jqcheck').length,
            rate_off: document.querySelectorAll('.rate-off').length,
            rate_offlarge: document.querySelectorAll('.rate-offlarge').length,
            radio_inputs: document.querySelectorAll('input[type=radio]').length,
            checkbox_inputs: document.querySelectorAll('input[type=checkbox]').length,
            tel_inputs: document.querySelectorAll('input[type=tel]').length,
            text_inputs: document.querySelectorAll('input[type=text]').length,
            number_inputs: document.querySelectorAll('input[type=number]').length,
            captchaOut: !!document.getElementById('captchaOut'),
            ctlNext: !!document.querySelector('#ctlNext'),
        };
        all.question_count = all.radio_inputs + all.checkbox_inputs;
        return all;
    })()
    """)
    print("=== 全局统计 ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False), flush=True)

    # ===== 第二部分：问卷标题 =====
    title = page.evaluate("""
    (function() {
        var h1 = document.querySelector('h1, .topic-title, [class*="title"]');
        return h1 ? h1.innerText.trim().slice(0, 80) : document.title;
    })()
    """)
    print(f"\n=== 问卷标题 === {title}", flush=True)

    # ===== 第三部分：矩阵量表分析（如果有） =====
    if stats['rate_off'] > 0:
        matrix = page.evaluate("""
        (function() {
            var ros = document.querySelectorAll('.rate-off');
            var total = ros.length;

            // 找列标签（.rate-offlarge 通常是量表顶部的列标签）
            var cols = [];
            var largeEls = document.querySelectorAll('.rate-offlarge');
            if (largeEls.length > 0) {
                cols = Array.from(largeEls).map(el => el.innerText.trim()).slice(0, 10);
            } else {
                // 备用：取第一行所有 .rate-off 的 title 属性
                var firstRow = Array.from(ros).slice(0, 10);
                cols = firstRow.map(el => el.title || el.getAttribute('data-value') || 'col' + cols.length);
            }

            // 推断行数（total / cols.length）
            var colsPerRow = cols.length > 0 ? cols.length : 7;  // 默认7分制
            var rowCount = Math.round(total / colsPerRow);

            // 找每行的题目名称（往上找 th 或题目标题）
            var rows = [];
            for (var i = 0; i < ros.length; i++) {
                // 找当前 .rate-off 所在行的题目文本
                var td = ros[i].closest('td');
                if (!td) continue;
                var tr = td.parentElement;
                if (!tr) continue;
                // 题目文本通常是同行第一个 td 的内容
                var firstTd = tr.querySelector('td');
                if (firstTd) {
                    var txt = firstTd.innerText.replace(/\\s+/g,' ').trim().slice(0, 40);
                    // 避免重复
                    if (rows.length === 0 || rows[rows.length - 1] !== txt) {
                        rows.push(txt);
                    }
                }
            }

            return {
                total: total,
                cols_per_row: colsPerRow,
                inferred_rows: rowCount,
                cols: cols,
                rows: rows.slice(0, 30),  // 最多30行
            };
        })()
        """)
        print(f"\n=== 矩阵量表分析 ===")
        print(f"  .rate-off 总数: {matrix['total']}", flush=True)
        print(f"  每行选项数: {matrix['cols_per_row']} ({'默认7分制' if matrix['cols_per_row'] == 7 else '可能是' + matrix['cols_per_row'] + '分制'})", flush=True)
        print(f"  推断行数: {matrix['inferred_rows']}", flush=True)
        print(f"  列标签: {matrix['cols']}", flush=True)
        print(f"  题目（前30行）:", flush=True)
        for i, r in enumerate(matrix['rows']):
            print(f"    [{i}] {r}", flush=True)

    # ===== 第四部分：单选题/多选 分析 =====
    if stats['jqradio'] > 0 or stats['jqcheck'] > 0:
        options = page.evaluate("""
        (function() {
            var out = [];
            // 找所有题目容器（包含 .jqradio 或 .jqcheck 的父级 div/li）
            var allRadios = document.querySelectorAll('.jqradio');
            var allChecks = document.querySelectorAll('.jqcheck');

            var seen = new Set();
            function getQuestion(el) {
                var parent = el.closest('div.field-item, li, div.question');
                if (!parent) parent = el.parentElement;
                if (!parent) return '';
                var txt = parent.innerText.replace(/\\s+/g,' ').trim().slice(0, 60);
                return txt;
            }

            allRadios.forEach(function(el) {
                var q = getQuestion(el);
                var inp = el.closest('.jqradiowrapper, div').querySelector('input[type=radio]');
                var val = inp ? inp.value : '?';
                var key = q + '|' + val;
                if (!seen.has(key)) {
                    seen.add(key);
                    out.push({type: 'radio', question: q, value: val});
                }
            });

            allChecks.forEach(function(el) {
                var q = getQuestion(el);
                var inp = el.closest('div').querySelector('input[type=checkbox]');
                var val = inp ? inp.value : '?';
                var key = q + '|' + val;
                if (!seen.has(key)) {
                    seen.add(key);
                    out.push({type: 'checkbox', question: q, value: val});
                }
            });

            return out.slice(0, 50);  // 最多50条
        })()
        """)
        print(f"\n=== 单选/多选（前50题）===")
        for item in options:
            print(f"  [{item['type']}] {item['question'][:50]} → value={item['value']}", flush=True)

    # ===== 第五部分：提交按钮 =====
    submit = page.evaluate("""
    (function() {
        var btn = document.querySelector('#ctlNext');
        if (!btn) return {found: false};
        var rect = btn.getBoundingClientRect();
        return {
            found: true,
            text: btn.innerText.trim(),
            visible: btn.offsetParent !== null,
            rect: {top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height)},
        };
    })()
    """)
    print(f"\n=== 提交按钮 === {json.dumps(submit, indent=2, ensure_ascii=False)}", flush=True)

    # ===== 第六部分：提交后状态检测（手动触发一次） =====
    print(f"\n=== 准备提交测试 ===", flush=True)
    print(f"  向下滚动到提交按钮...", flush=True)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1)

    # ===== 第七部分：捕获提交后的弹窗 =====
    print(f"  点击提交（用于观察弹窗类型）...", flush=True)
    submit_click = page.evaluate("""
    (function() {
        var btn = document.querySelector('#ctlNext');
        if (btn && btn.offsetParent !== null) {
            btn.click();
            return 'clicked';
        }
        return 'not_found_or_hidden';
    })()
    """)
    print(f"  提交按钮点击结果: {submit_click}", flush=True)

    # 等待5秒看页面变化
    time.sleep(5)

    # 检测弹窗/页面变化
    post_submit = page.evaluate("""
    (function() {
        var bodyText = document.body.innerText || '';
        var url = window.location.href;
        var results = {
            url: url,
            redirected: url !== window.location.href,
            body_preview: bodyText.replace(/\\s+/g,' ').trim().slice(0, 300),
            has_thanks: bodyText.indexOf('感谢') !== -1,
            has_captcha: !!document.getElementById('captchaOut'),
            captcha_visible: (function() {
                var c = document.getElementById('captchaOut');
                return c ? c.offsetParent !== null : false;
            })(),
            has_continue_prompt: bodyText.indexOf('继续') !== -1,
        };
        return results;
    })()
    """)
    print(f"\n=== 提交后页面状态 ===")
    print(json.dumps(post_submit, indent=2, ensure_ascii=False), flush=True)

    browser.close()
    print(f"\n分析完成！根据以上输出建立 RATE_OFFSETS 映射表。", flush=True)
```

### Step 2：建立 RATE_OFFSETS 映射表（最关键）

根据 Step 1 的输出来建立。最核心的工作是**确认每个矩阵量表行对应的 `.rate-off` 索引**：

```
例如 Step 1 输出:
  .rate-off 总数: 175
  每行7个 → 25行

  题目列表:
    [0] NHI1 遇问题倾向真人
    [1] NHI2 即使AI能解决也希望真人
    ...
    [4] TA1 担心AI无法解决问题
    ...

对应映射:
  RATE_OFFSETS = {
      "nhi1": 0,       # NHI1 从索引0开始 (0..6)
      "nhi2": 7,       # NHI2 从索引7开始 (7..13)
      "ta1": 14,       # TA1 从索引14开始 (14..20)
      ...
  }
```

**验证映射是否正确（逐个测试）：**

```python
def verify_offset(page, key, offset, expected_rows=1, cols_per_row=7):
    """验证 offset 映射是否正确：点击某行，检查选中状态"""
    results = []
    for row in range(expected_rows):
        row_offset = offset + row * cols_per_row
        for col in range(cols_per_row):
            idx = row_offset + col
            ok = page.evaluate(f"""
            (function() {{
                var ros = document.querySelectorAll('.rate-off');
                if (ros[{idx}]) {{ ros[{idx}].click(); return true; }}
                return false;
            }})()
            """)
            value = col + 1
            results.append(f"  {key}[row{row}][col{value}] @idx{idx} = {ok}")
    return results
```

---

## 题型填写代码模板

```python
#!/usr/bin/env python3
"""分析问卷星页面结构 - 每次接手新问卷必跑"""
from playwright.sync_api import sync_playwright
import json, time

url = "问卷URL"

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)  # 等待动态内容加载

    # 1. 统计所有关键元素
    stats = page.evaluate("""
    (function() {
        return {
            jqradio: document.querySelectorAll('.jqradio').length,
            jqcheck: document.querySelectorAll('.jqcheck').length,
            rate_off: document.querySelectorAll('.rate-off').length,
            radio_inputs: document.querySelectorAll('input[type=radio]').length,
            tel_inputs: document.querySelectorAll('input[type=tel]').length,
            text_inputs: document.querySelectorAll('input[type=text]').length,
            #ctlNext: !!document.querySelector('#ctlNext'),
            ctlNext_visible: (function() {
                var b = document.querySelector('#ctlNext');
                return b ? b.offsetParent !== null : false;
            })(),
        };
    })()
    """)
    print(json.dumps(stats, indent=2, ensure_ascii=False), flush=True)

    # 2. 分析矩阵量表（如果有 rate-off）
    if stats['rate_off'] > 0:
        matrix = page.evaluate("""
        (function() {
            var ros = document.querySelectorAll('.rate-off');
            // 按 .rate-offlarge 找列标签
            var labels = Array.from(document.querySelectorAll('.rate-offlarge'))
                .map(el => el.innerText.trim()).slice(0, 7);
            // 按 <tr> 找行标签（问卷每行一个题）
            var rows = Array.from(document.querySelectorAll('tr'))
                .filter(tr => tr.querySelector('.rate-off'))
                .map(tr => tr.innerText.split(/\\s+/)[0].slice(0, 20));
            return { total: ros.length, cols: labels, rows: rows.slice(0, 10) };
        })()
        """)
        print(json.dumps(matrix, indent=2, ensure_ascii=False), flush=True)

    # 3. 找提交按钮并测试点击
    btn_info = page.evaluate("""
    (function() {
        var btn = document.querySelector('#ctlNext');
        if (!btn) return {found: false};
        return {
            found: true,
            text: btn.innerText.trim(),
            visible: btn.offsetParent !== null,
            rect: btn.getBoundingClientRect(),
        };
    })()
    """)
    print(json.dumps(btn_info, indent=2, ensure_ascii=False), flush=True)

    browser.close()
```

---

## 题型填写代码模板

### 矩阵量表（最常用）

矩阵量表的所有 `.rate-off` 按行优先排列，每行 7 个选项（1-7分），总长度 = 行数 × 7。

**必须先运行调试脚本确认总数和行数**，再建立 offset 映射表：

```python
# 调试输出示例: total=175, 每行7个选项 → 25行
# 建立 offset 映射（0-based）：
RATE_OFFSETS = {
    "nhi1": 0,   # 第1题从索引0开始
    "nhi2": 7,   # 第2题从索引7开始
    "q1": 14,
    # ...
}

def click_rate(page, offset, value):
    """点击矩阵量表第 offset 行的 value 分（1-7）"""
    idx = offset + (value - 1)
    return page.evaluate(f"""
    (function() {{
        var ros = document.querySelectorAll('.rate-off');
        if (ros[{idx}]) {{ ros[{idx}].click(); return true; }}
        return false;
    }})()
    """)

# 使用
click_rate(page, RATE_OFFSETS["q1"], 5)  # Q1 打5分
```

### 单选题

```python
def click_radio(page, q_name, value):
    """点击 name=q_name, value=value 的单选按钮"""
    return page.evaluate(f"""
    (function() {{
        var inp = document.querySelector('input[name="{q_name}"][value="{value}"]');
        if (!inp) return false;
        inp.checked = true;
        inp.dispatchEvent(new Event('change', {{bubbles: true}}));
        // 问卷星的可见点击区域在 .jqradiowrapper > .jqradio
        var wrapper = inp.closest('.jqradiowrapper');
        if (wrapper) {{
            var a = wrapper.querySelector('.jqradio');
            if (a) a.click();
        }}
        return true;
    }})()
    """)

click_radio(page, "q1", 1)  # Q1 选择选项1
```

### 多选题

```python
def click_checkbox(page, q_name, value):
    """勾选 name=q_name, value=value 的多选框"""
    return page.evaluate(f"""
    (function() {{
        var inp = document.querySelector('input[name="{q_name}"][value="{value}"]');
        if (!inp) return false;
        inp.checked = true;
        inp.dispatchEvent(new Event('change', {{bubbles: true}}));
        var wrapper = inp.closest('.jqcheckwrapper') || inp.parentElement;
        if (wrapper) {{
            var c = wrapper.querySelector('.jqcheck');
            if (c) c.click();
        }}
        return true;
    }})()
    """)
```

### 数字/文本输入

```python
def fill_input(page, q_name, value):
    return page.evaluate(f"""
    (function() {{
        var el = document.querySelector('input[name="{q_name}"]');
        if (!el) return false;
        el.focus();
        el.value = '{value}';
        el.dispatchEvent(new Event('input', {{bubbles: true}}));
        el.dispatchEvent(new Event('change', {{bubbles: true}}));
        return true;
    }})()
    """)
```

---

## ⚠️ 提交后状态机（最关键章节）

### 问卷星提交后的完整状态图

```
点击「提交 #ctlNext」
        │
        ▼
┌───────────────────────────┐
│  状态1: success            │  ← 成功跳页（感谢/已收到/wr.aspx）
└───────────────────────────┘
        │
        ▼ （通常）
┌───────────────────────────┐
│  状态2: captcha            │  ← captchaOut 或 nc_wrapper 可见
│  → 刷新页面                │     问卷星后端验证触发
│  → time.sleep(3)          │
└───────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│  状态3: resume_draft       │  ← 页面出现「是否继续上次回答」
│  → JS_CLICK_RESUME_CONFIRM│     刷新后弹窗文案留在 body.innerText
│  → 点击「确认」            │     captchaOut 元素可能仍残留 DOM
│  → 滚动 → 再点 #ctlNext   │
└───────────────────────────┘
        │
        ▼ （可能再循环一次）
┌───────────────────────────┐
│  状态4: continue_prompt    │  ← 问卷内嵌的「继续作答」提示
│  → 点「继续作答」          │
│  → 滚动 → 再点 #ctlNext   │
└───────────────────────────┘
        │
        ▼
   （最多3轮，退出循环）
```

### 状态检测代码（可直接复制使用）

```python
def detect_post_submit_state(page):
    """检测提交后的页面状态，返回 {state, reason}"""
    return page.evaluate("""
    (function() {
        var bodyText = document.body.innerText || '';
        var url = window.location.href;

        // 1. 成功（优先级最高，同时检查文本和 URL）
        if (bodyText.indexOf('感谢') !== -1 || bodyText.indexOf('提交成功') !== -1 || bodyText.indexOf('已收到') !== -1) {
            return {state: 'success', reason: 'page_text'};
        }
        if (url.indexOf('wr.aspx') !== -1 || url.indexOf('thanks') !== -1) {
            return {state: 'success', reason: 'url=' + url};
        }

        // 2. 「是否继续上次回答」弹窗
        // ⚠️ 必须在 captchaOut 检测之前，因为 captchaOut 刷新后残留 DOM
        if (bodyText.indexOf('是否继续上次回答') !== -1 ||
            bodyText.indexOf('已经回答了部分题目') !== -1) {
            return {state: 'resume_draft', reason: 'continue_last_draft'};
        }

        // 3. 验证码弹窗（两种DOM）
        var captchaOut = document.getElementById('captchaOut');
        if (captchaOut && captchaOut.offsetParent !== null) {
            return {state: 'captcha', reason: 'captchaOut found'};
        }
        var ncWrapper = document.querySelector('[class*="nc_wrapper"], [id*="nc_wrapper"]');
        if (ncWrapper && ncWrapper.offsetParent !== null) {
            return {state: 'captcha', reason: 'nc_wrapper found'};
        }

        // 4. 其他内嵌继续提示
        if (bodyText.indexOf('继续填写') !== -1 || bodyText.indexOf('继续作答') !== -1) {
            return {state: 'continue_prompt', reason: 'continue_prompt'};
        }

        return {state: 'unknown', reason: bodyText.slice(0, 80), url: url};
    })()
    """)


def submit_with_retry(page, max_attempts=3):
    """
    完整提交流程：点击提交 → 循环检测状态 → 处理弹窗 → 重新提交
    返回 True 表示成功，False 表示需要人工介入
    """
    import time

    # 第一次点击提交
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1)

    click_result = page.evaluate("""
    (function() {
        var btn = document.querySelector('#ctlNext');
        if (btn && btn.offsetParent !== null) {
            btn.click();
            return 'ctlNext';
        }
        var all = document.querySelectorAll('button, a, input[type=button]');
        for (var i = 0; i < all.length; i++) {
            var t = (all[i].innerText || all[i].value || '').trim();
            if (t.includes('提交') && all[i].offsetParent !== null) {
                all[i].click();
                return 'text: ' + t;
            }
        }
        return 'not found';
    })()
    """)
    print(f"[{time.strftime('%H:%M:%S')}] 提交: {click_result}", flush=True)
    time.sleep(5)

    # 循环检测状态
    for attempt in range(max_attempts):
        state_info = detect_post_submit_state(page)
        state = state_info.get("state", "unknown")

        if state == "success":
            print(f"[{time.strftime('%H:%M:%S')}] ✓ 提交成功", flush=True)
            return True

        if state == "resume_draft":
            print(f"[{time.strftime('%H:%M:%S')}] 检测到「是否继续上次回答」，点击确认...", flush=True)
            result = page.evaluate(JS_CLICK_RESUME_CONFIRM)
            print(f"[{time.strftime('%H:%M:%S')}] 确认: {result}", flush=True)
            time.sleep(2)
            if not str(result).startswith("not found"):
                resumbit_and_wait(page)
            continue

        if state == "captcha":
            print(f"[{time.strftime('%H:%M:%S')}] 检测到验证码，刷新页面...", flush=True)
            page.reload(wait_until="domcontentloaded", timeout=30000)
            time.sleep(3)
            result = page.evaluate(JS_CLICK_RESUME_CONFIRM)
            print(f"[{time.strftime('%H:%M:%S')}] 确认: {result}", flush=True)
            time.sleep(2)
            if not str(result).startswith("not found"):
                resumbit_and_wait(page)
            continue

        if state == "continue_prompt":
            print(f"[{time.strftime('%H:%M:%S')}] 检测到「继续作答」提示，点击...", flush=True)
            page.evaluate("""
            (function() {
                var links = document.querySelectorAll('a');
                for (var i = 0; i < links.length; i++) {
                    var t = (links[i].innerText || '').replace(/\\s+/g,'').trim();
                    if (t === '继续填写' || t === '继续作答' || t === '继续' || t === '再次填写') {
                        if (links[i].offsetParent !== null) { links[i].click(); return t; }
                    }
                }
                var btns = document.querySelectorAll('button');
                for (var i = 0; i < btns.length; i++) {
                    var t = (btns[i].innerText || '').replace(/\\s+/g,'').trim();
                    if (t === '继续填写' || t === '继续作答' || t === '继续' || t === '再次填写') {
                        if (btns[i].offsetParent !== null) { btns[i].click(); return t; }
                    }
                }
                return 'not found';
            })()
            """)
            time.sleep(2)
            resumbit_and_wait(page)
            continue

        # unknown: 打印原因，可能已经成功（问卷星有时不跳转）
        print(f"[{time.strftime('%H:%M:%S')}] 未知状态: {state_info.get('reason')}", flush=True)
        return True  # 保守策略：默认成功

    print(f"[{time.strftime('%H:%M:%S')}] 达到最大尝试次数 {max_attempts}，需人工确认", flush=True)
    return False


def resumbit_and_wait(page):
    """点击确认后重新提交（通用逻辑）"""
    import time
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1)
    r = page.evaluate("""
    (function() {
        var btn = document.querySelector('#ctlNext');
        if (btn && btn.offsetParent !== null) { btn.click(); return 'ctlNext'; }
        var all = document.querySelectorAll('button, a');
        for (var i = 0; i < all.length; i++) {
            var t = (all[i].innerText || all[i].value || '').trim();
            if (t.includes('提交') && all[i].offsetParent !== null) { all[i].click(); return t; }
        }
        return 'not found';
    })()
    """)
    print(f"[{time.strftime('%H:%M:%S')}] 重新提交: {r}", flush=True)
    time.sleep(5)
```

---

## JS_CLICK_RESUME_CONFIRM 常量（核心弹窗处理）

**这是问卷星自动化最核心的 JS，直接复制到脚本中使用：**

```python
JS_CLICK_RESUME_CONFIRM = """
(function() {
    var promptNeedles = ['是否继续上次回答', '继续上次回答', '已经回答了部分题目'];
    var containers = document.querySelectorAll('div, section, dialog, [class*="dialog"], [class*="modal"]');
    var i, j, el, tx, btns, b, bt;

    // 第一优先：遍历所有容器，找包含弹窗文案的父元素
    for (i = 0; i < containers.length; i++) {
        el = containers[i];
        tx = (el.innerText || '').trim();
        // ⚠️ 关键：排除问卷整页容器（正文很长）
        if (tx.length > 1200) continue;

        var hit = false;
        for (j = 0; j < promptNeedles.length; j++) {
            if (tx.indexOf(promptNeedles[j]) !== -1) { hit = true; break; }
        }
        if (!hit) continue;

        // 在该弹窗容器内精确匹配按钮文字「确认」
        btns = el.querySelectorAll('button, a, span, div');
        for (j = 0; j < btns.length; j++) {
            b = btns[j];
            bt = (b.innerText || '').replace(/\\s+/g, '').trim();
            // ⚠️ 关键：用 === 而不是 indexOf，防止匹配到含"确认"的长文本
            if (bt === '确认' && b.offsetParent !== null) {
                b.click();
                return 'confirm_continue_modal';
            }
        }
    }

    // 第二优先：captchaOut 弹窗内搜索
    var popup = document.getElementById('captchaOut');
    var debug = popup ? 'popup=' + popup.innerText.replace(/\\s+/g,' ').slice(0, 200) : 'no popup';
    if (popup) {
        var candidates = [];
        var links = popup.querySelectorAll('a');
        var pbtns = popup.querySelectorAll('button');
        var onclickEls = popup.querySelectorAll('[onclick]');
        for (i = 0; i < links.length; i++) candidates.push(links[i]);
        for (i = 0; i < pbtns.length; i++) candidates.push(pbtns[i]);
        for (i = 0; i < onclickEls.length; i++) candidates.push(onclickEls[i]);
        for (i = 0; i < candidates.length; i++) {
            el = candidates[i];
            bt = (el.innerText||'').replace(/\\s+/g,'').trim();
            if (el.offsetParent !== null && bt === '确认') {
                el.click();
                return 'confirm_in_captchaOut';
            }
        }
    }

    // 第三优先：全局找「确认」按钮，但其 8 层父级内必须含弹窗文案
    var allBtns = document.querySelectorAll('button, a');
    for (i = 0; i < allBtns.length; i++) {
        b = allBtns[i];
        bt = (b.innerText || '').replace(/\\s+/g, '').trim();
        if (bt !== '确认' || !b.offsetParent) continue;
        var p = b.parentElement;
        for (var depth = 0; depth < 8 && p; depth++) {
            var pt = (p.innerText || '');
            if (pt.indexOf('是否继续上次回答') !== -1 || pt.indexOf('继续上次回答') !== -1) {
                b.click();
                return 'confirm_by_parent_text';
            }
            p = p.parentElement;
        }
    }
    return 'not found. ' + debug;
})()
"""
```

**返回值含义：**

| 返回值 | 含义 |
|--------|------|
| `confirm_continue_modal` | 在弹窗容器中找到并点击了「确认」 |
| `confirm_in_captchaOut` | 在 `captchaOut` 内找到并点击了「确认」 |
| `confirm_by_parent_text` | 全局搜索，在父级含弹窗文案的元素上找到「确认」 |
| `not found. popup=...` | 没找到，打印弹窗内容供调试 |

---

## 调试技巧：当按钮找不到时

`not found. popup=...` 返回的 `popup=...` 内容就是弹窗里真实的按钮结构，重点看：

```
not found. popup=您之前已经回答了部分题目，是否继续上次回答？ [按钮A] [按钮B]
```

将返回内容发给 AI，AI 即可识别按钮的真实标签名和文字。

---

## 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `print()` 无输出 | Python 缓冲 | `python3 -u script.py` 或每个 `print` 加 `flush=True` |
| 矩阵量表点不到 | `.rate-off` 索引超出范围 | 调试脚本确认总数：`document.querySelectorAll('.rate-off').length` |
| 单选题点不到 | 点击了隐藏的 `input` | 必须用 `.jqradiowrapper > .jqradio` 找可见元素 |
| 提交按钮找不到 | 按钮在页面底部不可见 | 先 `scrollTo(0, document.body.scrollHeight)` |
| 点完「确认」但没提交 | 只关了弹窗没重新点提交 | 在 `resume_draft` / `captcha` 分支里显式调用 `resumbit_and_wait(page)` |
| 刷新后 `captchaOut` 还在但找不到按钮 | `captchaOut` 是旧残留，内容已变 | **先检测**弹窗文案字符串，**再检测** `captchaOut.offsetParent` |
| 按钮文字匹配到整页 | 父元素是问卷正文容器 | 限制 `innerText.length < 1200`，且用 `=== '确认'` 而非 `indexOf` |
| 提交后一直 unknown | 问卷星不跳转 URL 但已成功 | 在 `unknown` 分支保守返回 `True`（默认成功） |
| 草稿残留导致数据覆盖 | 继续填写了旧草稿 | 每次循环都要点「确认」恢复草稿，保持状态连续 |

---

## 推荐工作流

```
Step 0: 手动打开问卷 → 记录题型组合（量表/单选/矩阵/文本）
Step 1: python3 -u analyze_wjx.py "URL"  # 完整分析 DOM
Step 2: 建立 RATE_OFFSETS 映射表           # 用 verify_offset 逐个验证
Step 3: 逐题手动测试点击                  # 确认 .rate-off / .jqradio 可点击
Step 4: 写 fill_questionnaire()            # 填完所有题
Step 5: python3 -u script.py --copies 1   # 单次端到端，观察弹窗类型
Step 6: 实现 submit_with_retry()            # 复制状态机代码
Step 7: python3 -u script.py --copies 5   # 5份测试
Step 8: 正式批量运行
```

---

## 安装

```bash
pip install playwright
python3 -m playwright install chromium   # 和 npm 的浏览器独立，都需要装
```
