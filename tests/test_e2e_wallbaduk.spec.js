const { test, expect } = require('@playwright/test');

test('벽바둑 E2E: 말 배치, 두 칸 이동, 벽 설치, 메시지 확인', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');

  // 첫번째 플레이어(빨강) 첫번째 말 배치 (0,0)
  await page.click('.cell[data-row="0"][data-col="0"]');
  // 두번째 플레이어(파랑) 첫번째 말 배치 (0,1)
  await page.click('.cell[data-row="0"][data-col="1"]');
  // 세번째 플레이어(노랑) 첫번째 말 배치 (0,2)
  await page.click('.cell[data-row="0"][data-col="2"]');
  // 세번째 플레이어(노랑) 두번째 말 배치 (6,2)
  await page.click('.cell[data-row="6"][data-col="2"]');
  // 두번째 플레이어(파랑) 두번째 말 배치 (6,1)
  await page.click('.cell[data-row="6"][data-col="1"]');
  // 첫번째 플레이어(빨강) 두번째 말 배치 (6,0)
  await page.click('.cell[data-row="6"][data-col="0"]');

  // 빨강 플레이어 첫번째 말 선택 (0,0)
  await page.click('.cell[data-row="0"][data-col="0"]');
  // 두 칸 이동: (0,0) → (1,0) → (1,1) (직각 이동)
  await page.click('.cell[data-row="1"][data-col="1"]');
  // 벽 설치: 이동한 말(1,1)의 오른쪽(1,2) 클릭
  await page.click('.cell[data-row="1"][data-col="2"]');

  // 메시지 영역에 벽 설치 메시지 노출 확인
  const message = await page.textContent('#message-area');
  expect(message).toContain('벽을 이동한 말');

  // 스크린샷 저장(옵션)
  await page.screenshot({ path: 'e2e_wallbaduk_result.png' });
}); 