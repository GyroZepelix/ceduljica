async (page) => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const origin = page.url().replace(/^(https?:\/\/[^/]+).*$/, '$1');
  assert(origin === 'http://127.0.0.1:43124', 'Use only the approved disposable T01 fixture on loopback port 43124.');
  const screenshots = [];
  const capture = async (name) => {
    const path = `.playwright-cli/t01-${name}.png`;
    await page.screenshot({ path, fullPage: true, animations: 'disabled' });
    screenshots.push(path);
  };
  const overflow = async (label) => {
    const ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    assert(ok, `${label}: horizontal page overflow`);
  };
  const loaded = async () => {
    const image = page.getByRole('dialog').getByRole('img');
    await image.evaluate(async (node) => { await node.decode(); });
    return image.evaluate((node) => ({ src: node.currentSrc, width: node.naturalWidth, height: node.naturalHeight }));
  };
  const openHowTo = async () => {
    await page.getByRole('button', { name: 'How to use' }).click();
    assert(await page.getByRole('button', { name: 'Close How to use Ceduljica' }).evaluate((node) => node === document.activeElement), 'Dialog initial focus');
  };
  const scenes = ['create', 'invite', 'write', 'ready', 'reveal'];
  const assets = [];
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin);
  await overflow('desktop landing');
  await capture('landing-desktop');
  await openHowTo();
  for (const [index, scene] of scenes.entries()) {
    const image = await loaded();
    assert(image.width === 1536 && image.height === 1024, `${scene}: failed real image decode`);
    const response = await page.request.get(image.src);
    assert(response.status() === 200 && response.headers()['content-type'].includes('image/png'), `${scene}: production image HTTP failure`);
    assets.push(image);
    await capture(`howto-${scene}-desktop`);
    if (index < 4) await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  assert(new Set(assets.map((image) => image.src)).size === 5, 'Expected five distinct built assets');
  await page.keyboard.press('Escape');
  assert(await page.getByRole('button', { name: 'How to use' }).evaluate((node) => node === document.activeElement), 'Dialog focus return');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await overflow(`${width}px landing`);
    await capture(`landing-${width}`);
    await openHowTo();
    for (const [index, scene] of scenes.entries()) {
      await loaded();
      await overflow(`${width}px ${scene}`);
      const action = page.getByRole('button', { name: index < 4 ? 'Next' : "Let's make notes", exact: true });
      await action.scrollIntoViewIfNeeded();
      assert(await action.isVisible(), 'How-to action must remain reachable');
      await capture(`howto-${scene}-${width}`);
      await action.click();
    }
  }

  // 1440x1000 at 200% browser zoom has a 720x500 CSS-pixel layout viewport.
  // CSS zoom is not equivalent: it fails to adjust media queries and vh units.
  await page.setViewportSize({ width: 720, height: 500 });
  await overflow('200% equivalent viewport landing');
  await capture('landing-zoom200');
  await openHowTo();
  await loaded();
  await page.getByRole('button', { name: 'Next', exact: true }).scrollIntoViewIfNeeded();
  await overflow('200% equivalent viewport dialog');
  await capture('howto-zoom200');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert(await page.locator('.note-motif').evaluate((node) => getComputedStyle(node).animationName) === 'none', 'Reduced motion must be static');
  await capture('reduced-motion');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  assert(await page.locator('.note-motif').evaluate((node) => getComputedStyle(node).animationName) === 'plaza-drift', 'Normal drift missing');
  const driftMoves = await page.locator('.note-motif').evaluate(async (node) => {
    const before = getComputedStyle(node).backgroundPositionX;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return before !== getComputedStyle(node).backgroundPositionX;
  });
  assert(driftMoves, 'Normal motif animation must actually advance');
  const hiddenMotion = await page.evaluate(async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const paused = getComputedStyle(document.querySelector('.note-motif')).animationPlayState;
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return { paused, resumed: getComputedStyle(document.querySelector('.note-motif')).animationPlayState };
  });
  assert(hiddenMotion.paused === 'paused' && hiddenMotion.resumed === 'running', 'Visibility pause/resume failed');

  // Only synthetic room data on this disposable server; no existing rooms/sessions.
  await page.getByLabel('Your display name').first().fill('Art Owner');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await page.getByRole('heading', { name: 'Bring your people in' }).waitFor();
  await capture('lobby-desktop');
  const invite = await page.getByLabel('Private invite link').inputValue();
  const guestContext = await page.context().browser().newContext({ viewport: { width: 390, height: 844 } });
  try {
    const guest = await guestContext.newPage();
    await guest.goto(invite);
    await guest.getByLabel('Your display name').last().fill('Art Guest');
    await guest.getByRole('button', { name: 'Join room' }).click();
    await guest.getByRole('heading', { name: 'Bring your people in' }).waitFor();
    await page.getByText('2 of 12 people').waitFor();
    await page.getByRole('button', { name: 'Begin writing' }).click();
    await page.getByLabel('Your note').fill('A disposable art-check note.\nWarm surfaces, readable words.');
    await capture('writing-desktop');
    await page.setViewportSize({ width: 320, height: 844 });
    await overflow('320px writing');
    await capture('writing-320');
    await page.getByRole('button', { name: "I'm ready" }).click();
    await page.getByRole('heading', { name: /You're ready/ }).waitFor();
    await capture('ready-320');
    await guest.getByLabel('Your note').fill('Another synthetic note for the shared fold check.');
    await guest.getByRole('button', { name: "I'm ready" }).click();
    await page.getByRole('heading', { name: 'Notes up!' }).waitFor();
    await overflow('320px shared note folds');
    await capture('folds-320');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture('folds-desktop');
    await page.getByRole('button', { name: 'Delete room' }).click();
    await page.getByRole('button', { name: 'Delete room permanently' }).click();
    await page.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();
    await capture('terminal-desktop');
    await page.setViewportSize({ width: 320, height: 844 });
    await overflow('320px terminal');
    await capture('terminal-320');
  } finally {
    await guestContext.close();
  }
  assert(browserErrors.length === 0, `Browser errors: ${browserErrors.join('; ')}`);
  return { status: 'passed', assets, hiddenMotion, screenshots, browserErrors, zoom: '720x500 effective layout viewport equivalent to 1440x1000 at 200%; native browser zoom not claimed' };
}
