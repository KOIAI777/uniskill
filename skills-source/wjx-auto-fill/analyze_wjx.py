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

            var cols = [];
            var largeEls = document.querySelectorAll('.rate-offlarge');
            if (largeEls.length > 0) {
                cols = Array.from(largeEls).map(el => el.innerText.trim()).slice(0, 10);
            } else {
                var firstRow = Array.from(ros).slice(0, 10);
                cols = firstRow.map(el => el.title || el.getAttribute('data-value') || 'col' + cols.length);
            }

            var colsPerRow = cols.length > 0 ? cols.length : 7;
            var rowCount = Math.round(total / colsPerRow);

            var rows = [];
            for (var i = 0; i < ros.length; i++) {
                var td = ros[i].closest('td');
                if (!td) continue;
                var tr = td.parentElement;
                if (!tr) continue;
                var firstTd = tr.querySelector('td');
                if (firstTd) {
                    var txt = firstTd.innerText.replace(/\\s+/g,' ').trim().slice(0, 40);
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
                rows: rows.slice(0, 30),
            };
        })()
        """)
        print(f"\n=== 矩阵量表分析 ===")
        print(f"  .rate-off 总数: {matrix['total']}", flush=True)
        print(f"  每行选项数: {matrix['cols_per_row']} ({'默认7分制' if matrix['cols_per_row'] == 7 else '可能是' + str(matrix['cols_per_row']) + '分制'})", flush=True)
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

            return out.slice(0, 50);
        })()
        """)
        print(f"\n=== 单选/多选（前50题）===")
        for item in options:
            print(f"  [{item['type']}] {item['question'][:50]} → value={item['value']}", flush=True)

    # ===== 第五部分：填空题分析 =====
    fill_analysis = page.evaluate("""
    (function() {
        var out = [];
        var inputs = document.querySelectorAll('input[type=text], input[type=tel], input[type=number]');
        inputs.forEach(function(inp) {
            var name = inp.name || '';
            var placeholder = inp.placeholder || '';
            var parent = inp.closest('.field-item, .question, div');
            var qText = parent ? parent.innerText.replace(/\\s+/g,' ').trim().slice(0, 80) : '';
            out.push({
                name: name,
                placeholder: placeholder,
                question: qText.slice(0, 60),
            });
        });
        return out;
    })()
    """)
    print(f"\n=== 填空/数字输入题 ===")
    for item in fill_analysis:
        print(f"  name={item['name']} placeholder={item['placeholder']} question={item['question']}", flush=True)

    # ===== 第六部分：提交按钮 =====
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

    # ===== 第七部分：提交后状态检测（手动触发一次） =====
    print(f"\n=== 准备提交测试 ===", flush=True)
    print(f"  向下滚动到提交按钮...", flush=True)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1)

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

    time.sleep(5)

    post_submit = page.evaluate("""
    (function() {
        var bodyText = document.body.innerText || '';
        var url = window.location.href;
        var results = {
            url: url,
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
    print(f"\n分析完成！根据以上输出建立填写逻辑。", flush=True)
