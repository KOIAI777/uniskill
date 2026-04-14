# APA 7 Three-Line Table Template

本模板用于：

- 检测现有表格是否符合 APA 7 / 三线表
- 把统计结果整理成论文可用的三线表字段布局

## 1. Core Rule

APA 7 表格默认采用简洁的三线表思路：

- 顶线
- 表头下方一条线
- 底线

通常：

- 不要竖线
- 不要整张表每格都画边框
- 表号在上，标题在下
- 如有说明，写 `Note.`

## 2. Detection Output

检测现有表格时，固定输出：

### 三线表问题清单

- 是否有竖线
- 是否线条过多
- 表号是否规范
- 表题是否规范
- 小数位是否统一
- 是否缺 `Note.`
- 是否缺显著性说明

### 修正后的推荐结构

- 建议列名
- 建议行顺序
- 建议保留的小数位
- 建议的 `Note.`

## 3. Standard Skeleton

```text
Table 1
Descriptive statistics and correlations among key variables

| Variable | M | SD | 1 | 2 | 3 |
|---|---:|---:|---:|---:|---:|
| 1. SAT_total | 4.69 | 0.70 | — | | |
| 2. Trust | 4.52 | 0.96 | .58*** | — | |
| 3. BI | 4.55 | 1.16 | .56*** | .69*** | — |

Note. N = 170. M = mean; SD = standard deviation. *** p < .001.
```

## 4. Common Table Types

### A. Descriptive Statistics

推荐列：

`Variable / N / M / SD / Min / Max`

### B. Reliability Table

推荐列：

`Scale / Items / Cronbach's alpha / Judgment`

### C. Correlation Matrix

推荐列：

`Variable / M / SD / 1 / 2 / 3 / ...`

### D. Hypothesis Testing Summary

推荐列：

`Hypothesis / Method / Key statistic / p / Effect size / Result`

### E. ANCOVA / ANOVA Table

推荐列：

`Source / SS / df / F / p / partial eta squared`

### F. Regression Table

推荐列：

`Predictor / B / SE / beta / t / p`

### G. Mediation Or Moderation Summary

推荐列：

`Path / Coefficient / SE / p / 95% CI / Conclusion`

## 5. Word Finalization Reminder

如果输出给用户复制进 Word，必须附一句：

`最终 Word 版请按 APA 7 / 三线表样式保留三条核心横线，删除竖线和多余边框。`
