# Test info

- Name: 벽바둑 E2E: 영역 분리로 인한 게임 종료
- Location: C:\Users\yms96\Projects\bbaduk\tests\test_e2e_wallbaduk_end.spec.js:3:1

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)

Locator: locator('#message-area')
Expected string: "게임 종료"
Received string: ""
Call log:
  - expect.toContainText with timeout 5000ms
  - waiting for locator('#message-area')
    7 × locator resolved to <div class="error" id="message-area">자신의 말을 먼저 선택해주세요.</div>
      - unexpected value "자신의 말을 먼저 선택해주세요."
    2 × locator resolved to <div class="" id="message-area"></div>
      - unexpected value ""

    at C:\Users\yms96\Projects\bbaduk\tests\test_e2e_wallbaduk_end.spec.js:82:47
```

# Page snapshot

```yaml
- heading "벽바둑 게임" [level=1]
- paragraph: "현재 플레이어: 플레이어 1 (red)"
- paragraph: "남은 시간: 85초"
- 'button "벽 부수기 (남은 횟수: 1)" [disabled]'
- button "예"
- button "아니오"
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test('벽바둑 E2E: 영역 분리로 인한 게임 종료', async ({ page }) => {
   4 |   await page.goto('http://127.0.0.1:5500/index.html');
   5 |
   6 |   // 1. 모든 플레이어 말 배치 (각자 구석에)
   7 |   await page.click('.cell[data-row="0"][data-col="0"]'); // 빨강1
   8 |   await page.click('.cell[data-row="0"][data-col="6"]'); // 파랑1
   9 |   await page.click('.cell[data-row="6"][data-col="6"]'); // 노랑1
  10 |   await page.click('.cell[data-row="6"][data-col="0"]'); // 노랑2
  11 |   await page.click('.cell[data-row="3"][data-col="3"]'); // 파랑2
  12 |   await page.click('.cell[data-row="3"][data-col="0"]'); // 빨강2
  13 |
  14 |   // 2. 각 플레이어가 자신의 말 주변을 벽으로 완전히 막아 영역 분리
  15 |   // 빨강1 (0,0) 하단(1,0) 벽
  16 |   await page.click('.cell[data-row="0"][data-col="0"]');
  17 |   await page.click('.cell[data-row="0"][data-col="0"]');
  18 |   await page.click('.cell[data-row="1"][data-col="0"]');
  19 |   // 빨강1 (0,0) 우측(0,1) 벽
  20 |   await page.click('.cell[data-row="0"][data-col="0"]');
  21 |   await page.click('.cell[data-row="0"][data-col="0"]');
  22 |   await page.click('.cell[data-row="0"][data-col="1"]');
  23 |
  24 |   // 파랑1 (0,6) 하단(1,6) 벽
  25 |   await page.click('.cell[data-row="0"][data-col="6"]');
  26 |   await page.click('.cell[data-row="0"][data-col="6"]');
  27 |   await page.click('.cell[data-row="1"][data-col="6"]');
  28 |   // 파랑1 (0,6) 좌측(0,5) 벽
  29 |   await page.click('.cell[data-row="0"][data-col="6"]');
  30 |   await page.click('.cell[data-row="0"][data-col="6"]');
  31 |   await page.click('.cell[data-row="0"][data-col="5"]');
  32 |
  33 |   // 노랑1 (6,6) 상단(5,6) 벽
  34 |   await page.click('.cell[data-row="6"][data-col="6"]');
  35 |   await page.click('.cell[data-row="6"][data-col="6"]');
  36 |   await page.click('.cell[data-row="5"][data-col="6"]');
  37 |   // 노랑1 (6,6) 좌측(6,5) 벽
  38 |   await page.click('.cell[data-row="6"][data-col="6"]');
  39 |   await page.click('.cell[data-row="6"][data-col="6"]');
  40 |   await page.click('.cell[data-row="6"][data-col="5"]');
  41 |
  42 |   // 노랑2 (6,0) 상단(5,0) 벽
  43 |   await page.click('.cell[data-row="6"][data-col="0"]');
  44 |   await page.click('.cell[data-row="6"][data-col="0"]');
  45 |   await page.click('.cell[data-row="5"][data-col="0"]');
  46 |   // 노랑2 (6,0) 우측(6,1) 벽
  47 |   await page.click('.cell[data-row="6"][data-col="0"]');
  48 |   await page.click('.cell[data-row="6"][data-col="0"]');
  49 |   await page.click('.cell[data-row="6"][data-col="1"]');
  50 |
  51 |   // 파랑2 (3,3) 상단(2,3) 벽
  52 |   await page.click('.cell[data-row="3"][data-col="3"]');
  53 |   await page.click('.cell[data-row="3"][data-col="3"]');
  54 |   await page.click('.cell[data-row="2"][data-col="3"]');
  55 |   // 파랑2 (3,3) 하단(4,3) 벽
  56 |   await page.click('.cell[data-row="3"][data-col="3"]');
  57 |   await page.click('.cell[data-row="3"][data-col="3"]');
  58 |   await page.click('.cell[data-row="4"][data-col="3"]');
  59 |   // 파랑2 (3,3) 좌측(3,2) 벽
  60 |   await page.click('.cell[data-row="3"][data-col="3"]');
  61 |   await page.click('.cell[data-row="3"][data-col="3"]');
  62 |   await page.click('.cell[data-row="3"][data-col="2"]');
  63 |   // 파랑2 (3,3) 우측(3,4) 벽
  64 |   await page.click('.cell[data-row="3"][data-col="3"]');
  65 |   await page.click('.cell[data-row="3"][data-col="3"]');
  66 |   await page.click('.cell[data-row="3"][data-col="4"]');
  67 |
  68 |   // 빨강2 (3,0) 상단(2,0) 벽
  69 |   await page.click('.cell[data-row="3"][data-col="0"]');
  70 |   await page.click('.cell[data-row="3"][data-col="0"]');
  71 |   await page.click('.cell[data-row="2"][data-col="0"]');
  72 |   // 빨강2 (3,0) 하단(4,0) 벽
  73 |   await page.click('.cell[data-row="3"][data-col="0"]');
  74 |   await page.click('.cell[data-row="3"][data-col="0"]');
  75 |   await page.click('.cell[data-row="4"][data-col="0"]');
  76 |   // 빨강2 (3,0) 우측(3,1) 벽
  77 |   await page.click('.cell[data-row="3"][data-col="0"]');
  78 |   await page.click('.cell[data-row="3"][data-col="0"]');
  79 |   await page.click('.cell[data-row="3"][data-col="1"]');
  80 |
  81 |   // 3. 게임 종료 메시지 확인
> 82 |   await expect(page.locator('#message-area')).toContainText('게임 종료', { timeout: 5000 });
     |                                               ^ Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)
  83 | }); 
```