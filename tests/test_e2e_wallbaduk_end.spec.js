const { test, expect } = require('@playwright/test');

test('벽바둑 E2E: 영역 분리로 인한 게임 종료', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');

  // 1. 모든 플레이어 말 배치 (각자 구석에)
  await page.click('.cell[data-row="0"][data-col="0"]'); // 빨강1
  await page.click('.cell[data-row="0"][data-col="6"]'); // 파랑1
  await page.click('.cell[data-row="6"][data-col="6"]'); // 노랑1
  await page.click('.cell[data-row="6"][data-col="0"]'); // 노랑2
  await page.click('.cell[data-row="3"][data-col="3"]'); // 파랑2
  await page.click('.cell[data-row="3"][data-col="0"]'); // 빨강2

  // 2. 각 플레이어가 자신의 말 주변을 벽으로 완전히 막아 영역 분리
  // 빨강1 (0,0) 하단(1,0) 벽
  await page.click('.cell[data-row="0"][data-col="0"]');
  await page.click('.cell[data-row="0"][data-col="0"]');
  await page.click('.cell[data-row="1"][data-col="0"]');
  // 빨강1 (0,0) 우측(0,1) 벽
  await page.click('.cell[data-row="0"][data-col="0"]');
  await page.click('.cell[data-row="0"][data-col="0"]');
  await page.click('.cell[data-row="0"][data-col="1"]');

  // 파랑1 (0,6) 하단(1,6) 벽
  await page.click('.cell[data-row="0"][data-col="6"]');
  await page.click('.cell[data-row="0"][data-col="6"]');
  await page.click('.cell[data-row="1"][data-col="6"]');
  // 파랑1 (0,6) 좌측(0,5) 벽
  await page.click('.cell[data-row="0"][data-col="6"]');
  await page.click('.cell[data-row="0"][data-col="6"]');
  await page.click('.cell[data-row="0"][data-col="5"]');

  // 노랑1 (6,6) 상단(5,6) 벽
  await page.click('.cell[data-row="6"][data-col="6"]');
  await page.click('.cell[data-row="6"][data-col="6"]');
  await page.click('.cell[data-row="5"][data-col="6"]');
  // 노랑1 (6,6) 좌측(6,5) 벽
  await page.click('.cell[data-row="6"][data-col="6"]');
  await page.click('.cell[data-row="6"][data-col="6"]');
  await page.click('.cell[data-row="6"][data-col="5"]');

  // 노랑2 (6,0) 상단(5,0) 벽
  await page.click('.cell[data-row="6"][data-col="0"]');
  await page.click('.cell[data-row="6"][data-col="0"]');
  await page.click('.cell[data-row="5"][data-col="0"]');
  // 노랑2 (6,0) 우측(6,1) 벽
  await page.click('.cell[data-row="6"][data-col="0"]');
  await page.click('.cell[data-row="6"][data-col="0"]');
  await page.click('.cell[data-row="6"][data-col="1"]');

  // 파랑2 (3,3) 상단(2,3) 벽
  await page.click('.cell[data-row="3"][data-col="3"]');
  await page.click('.cell[data-row="3"][data-col="3"]');
  await page.click('.cell[data-row="2"][data-col="3"]');
  // 파랑2 (3,3) 하단(4,3) 벽
  await page.click('.cell[data-row="3"][data-col="3"]');
  await page.click('.cell[data-row="3"][data-col="3"]');
  await page.click('.cell[data-row="4"][data-col="3"]');
  // 파랑2 (3,3) 좌측(3,2) 벽
  await page.click('.cell[data-row="3"][data-col="3"]');
  await page.click('.cell[data-row="3"][data-col="3"]');
  await page.click('.cell[data-row="3"][data-col="2"]');
  // 파랑2 (3,3) 우측(3,4) 벽
  await page.click('.cell[data-row="3"][data-col="3"]');
  await page.click('.cell[data-row="3"][data-col="3"]');
  await page.click('.cell[data-row="3"][data-col="4"]');

  // 빨강2 (3,0) 상단(2,0) 벽
  await page.click('.cell[data-row="3"][data-col="0"]');
  await page.click('.cell[data-row="3"][data-col="0"]');
  await page.click('.cell[data-row="2"][data-col="0"]');
  // 빨강2 (3,0) 하단(4,0) 벽
  await page.click('.cell[data-row="3"][data-col="0"]');
  await page.click('.cell[data-row="3"][data-col="0"]');
  await page.click('.cell[data-row="4"][data-col="0"]');
  // 빨강2 (3,0) 우측(3,1) 벽
  await page.click('.cell[data-row="3"][data-col="0"]');
  await page.click('.cell[data-row="3"][data-col="0"]');
  await page.click('.cell[data-row="3"][data-col="1"]');

  // 3. 게임 종료 메시지 확인
  await expect(page.locator('#message-area')).toContainText('게임 종료', { timeout: 5000 });
}); 