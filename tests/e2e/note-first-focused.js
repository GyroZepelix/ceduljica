async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const origin = page.url().replace(/^(https?:\/\/[^/]+).*$/, '$1');
  const prefix = `.playwright-cli/02-01-${Date.now()}`;
  const screenshots = [];
  const errors = [];
  const observe = async (target) => {
    target.on('pageerror', error => errors.push(error.message));
    await target.addInitScript(() => {
      window.noteFlights = [];
      document.addEventListener('animationstart', event => {
        if (event.animationName.startsWith('note-fly-')) window.noteFlights.push(event.animationName);
      });
    });
  };
  const capture = async (target, name) => {
    const path = `${prefix}-${name}.png`;
    await target.screenshot({ path, fullPage: true });
    screenshots.push(path);
  };
  const noOverflow = async (target, label) => {
    const sizes = await target.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    assert(sizes.scroll <= sizes.width, `${label}: horizontal overflow ${JSON.stringify(sizes)}`);
  };
  const identities = async (target, selector) => target.locator(selector).evaluateAll(nodes => nodes.map(node => node.getAttribute('data-avatar-slot')));
  const browser = page.context().browser();
  const guestContext = await browser.newContext({ viewport: { width: 320, height: 800 }, reducedMotion: 'reduce' });
  const guest = await guestContext.newPage();
  try {
    await observe(page);
    await observe(guest);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin);
    await page.getByLabel('Your display name').first().fill('Owner');
    await page.getByRole('button', { name: 'Create a room' }).click();
    const invite = await page.getByLabel('Private invite link').inputValue();
    await guest.goto(invite);
    await guest.getByLabel('Your display name').last().fill('Guest');
    await guest.getByRole('button', { name: 'Join room' }).click();
    await page.getByText('2 of 12 people').waitFor();
    const before = await identities(page, '.people-card .avatar');
    assert(new Set(before).size === 2, 'Participant identities collided.');
    assert(JSON.stringify(before) === JSON.stringify(await identities(guest, '.people-disclosure .avatar')), 'Clients disagree on assigned identity.');
    await page.getByRole('button', { name: 'Begin writing' }).click();
    await page.getByRole('heading', { name: 'Write one private note' }).waitFor();
    await guest.getByLabel('Your note').waitFor();
    assert(await page.getByRole('heading', { name: 'Write one private note' }).evaluate(node => node === document.activeElement), 'Writing heading did not receive immediate focus.');
    await page.waitForFunction(() => window.noteFlights.includes('note-fly-in'));
    await page.locator('.note-flight').waitFor({ state: 'detached' });
    assert(await guest.locator('.note-flight').count() === 0, 'Reduced motion has a flight overlay.');
    assert(await page.locator('.phase-card').evaluate(node => getComputedStyle(node).backgroundColor) === 'rgba(0, 0, 0, 0)', 'Writing still has an enclosing panel.');
    assert(await page.locator('.composer-note').evaluate(node => getComputedStyle(node).backgroundColor) === 'rgb(255, 213, 61)', 'Composer is not yellow.');
    await page.getByLabel('Your note').fill('A sunny idea\nA second line');
    await page.getByRole('button', { name: "I'm ready" }).click();
    await page.getByRole('heading', { name: /You're ready/ }).waitFor();
    await capture(page, 'desktop-ready');
    await page.getByRole('button', { name: 'Edit note' }).click();
    await page.getByLabel('Your note').waitFor();
    assert(await page.getByLabel('Your note').evaluate(node => node === document.activeElement), 'Edit did not return focus to the textarea.');
    assert(await page.getByLabel('Your note').inputValue() === 'A sunny idea\nA second line', 'Ready/Edit lost multiline draft.');
    await capture(page, 'desktop-writing');
    const longNote = 'x'.repeat(500);
    await guest.getByLabel('Your note').fill(longNote);
    await guest.getByText('500 / 500 — limit reached').waitFor();
    await noOverflow(guest, '320px writing');
    await capture(guest, 'phone-writing');
    await guest.waitForTimeout(850); // Exercise existing 600 ms draft debounce, then real reload.
    await guest.reload();
    await guest.getByLabel('Your note').waitFor();
    assert(await guest.getByLabel('Your note').inputValue() === longNote, 'Reload lost the saved 500-character draft.');
    assert(JSON.stringify(await identities(guest, '.people-disclosure .avatar')) === JSON.stringify(before), 'Reload changed identity.');
    assert(!(await guest.content()).includes('A sunny idea'), 'Guest received private owner text.');
    assert(!(await page.content()).includes(longNote), 'Owner received private guest text.');
    assert((await page.evaluate(() => window.noteFlights)).filter(name => name === 'note-fly-in').length === 1, 'Ready/Edit or snapshots replayed entry.');
    await guest.getByRole('button', { name: "I'm ready" }).click();
    await guest.getByRole('heading', { name: /You're ready/ }).waitFor();
    await page.getByRole('button', { name: "I'm ready" }).click();
    await page.getByRole('heading', { name: 'Notes up!' }).waitFor();
    await guest.getByRole('heading', { name: 'Notes up!' }).waitFor();
    assert(await page.getByRole('heading', { name: 'Notes up!' }).evaluate(node => node === document.activeElement), 'Reveal focus delayed.');
    assert(await page.locator('textarea').count() === 0, 'Reveal retained interactive editor.');
    assert(await page.getByRole('button', { name: 'Start a new round' }).isEnabled(), 'Reveal controls unavailable.');
    await page.waitForFunction(() => window.noteFlights.includes('note-fly-out'));
    assert(JSON.stringify(await identities(page, '.note-board footer .avatar')) === JSON.stringify(before), 'Reveal author identities changed.');
    const geometry = await page.locator('.room-main').evaluate(main => {
      const board = main.querySelector('.note-board').getBoundingClientRect();
      const region = main.getBoundingClientRect();
      return { tracks: getComputedStyle(main).gridTemplateColumns, width: board.width, regionWidth: region.width, center: board.x + board.width / 2, viewportCenter: innerWidth / 2 };
    });
    assert(!geometry.tracks.includes(' '), `Reveal reserved another grid track: ${geometry.tracks}`);
    assert(Math.abs(geometry.center - geometry.viewportCenter) < 2 && geometry.width >= geometry.regionWidth - 2, 'Reveal board is not centered in complete width.');
    await noOverflow(page, 'desktop reveal');
    await noOverflow(guest, '320px reveal');
    await capture(page, 'desktop-reveal-flight');
    await page.locator('.note-flight').waitFor({ state: 'detached' });
    await capture(page, 'desktop-reveal');
    await capture(guest, 'phone-reveal');
    await page.getByRole('button', { name: 'Start a new round' }).click();
    await page.getByLabel('Your note').waitFor();
    await guest.getByLabel('Your note').waitFor();
    assert(await page.getByLabel('Your note').inputValue() === '', 'Replay retained old draft.');
    assert(await guest.getByLabel('Your note').inputValue() === '', 'Guest replay retained old draft.');
    assert(await page.locator('.note-flight-out').count() === 0, 'Replay retained outgoing overlay.');
    await page.waitForFunction(() => window.noteFlights.filter(name => name === 'note-fly-in').length === 2);
    assert((await guest.evaluate(() => window.noteFlights)).length === 0, 'Reduced-motion guest animated.');
    await page.getByRole('button', { name: 'Delete room', exact: false }).first().click();
    await page.getByRole('button', { name: 'Delete room permanently' }).click();
    await guest.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();
    await page.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();
    assert(await page.locator('.note-flight').count() === 0, 'Terminal event retained overlay.');
    assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
    return { status: 'passed', geometry, screenshots, scenarios: ['desktop owner / 320px reduced-motion guest', 'authoritative entry, Ready/Edit/debounce/reload/privacy/reveal/replay/deletion', 'stable avatar attribution, immediate focus, centered board, long-note overflow'] };
  } finally {
    await guestContext.close();
  }
}
