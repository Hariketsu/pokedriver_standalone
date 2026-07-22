# 宝可驾素材包

从 `pokedriver_standalone` 项目提取的可复用素材。

## 包含文件

| 文件 | 内容 | 数量 |
|------|------|------|
| `questions.json` | 驾考题库（完整格式，含 id/q/opts/ans） | 1034 题 |
| `questions_simple.jsonl` | 驾考题库（简化格式，每行一个 JSON） | 1034 题 |
| `pokemon.json` | 宝可梦数据（id/名称/中文名/稀有度/是否有图标） | 721 只 |
| `pokemon_icons.json` | 宝可梦精灵图（base64 PNG，key 为 id） | 721 个 |
| `constants.ts` | 游戏常量（传说宝可梦分类、升级上限等） | — |
| `game_rules.json` | 稀有度体系、颜色规则、HP/速度计算公式 | — |

## 数据结构

### 驾考题 (`questions_simple.jsonl`)
```json
{"q": "题目文字", "opts": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"], "ans": 0}
```
- `ans` 是正确答案的索引（0-3）

### 宝可梦 (`pokemon.json`)
```json
{"id": 25, "n": "pikachu", "c": "皮卡丘", "r": "u", "i": 1}
```
- `r`: 稀有度 — `c`(普通) `u`(稀有) `r`(珍贵) `l`(传说)
- `i`: 是否有图标 — `1` 有 `0` 无

### 精灵图 (`pokemon_icons.json`)
```json
{"25": "data:image/png;base64,iVBORw0KGgo..."}
```
- Key 为宝可梦 ID，值为 base64 编码的 PNG（可直接用于 `<img src="...">`）

### 稀有度体系 (`game_rules.json`)
- 四种稀有度各有不同的颜色、HP 倍率、速度倍率
- 包含"一级神/二级神/幻兽"分类

