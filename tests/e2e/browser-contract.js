async (page) => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const origin = page.url().replace(/^(https?:\/\/[^/]+).*$/, '$1');

  const noHorizontalOverflow = async (target, label) => {
    const sizes = await target.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert(sizes.scroll <= sizes.client, `${label} overflowed horizontally: ${sizes.scroll} > ${sizes.client}`);
  };

  const sessionFrom = async (target) => {
    const raw = await target.evaluate(() => localStorage.getItem('ceduljica:session'));
    assert(raw !== null, 'Expected a persisted participant session.');
    return JSON.parse(raw);
  };

  const postSession = async (context, path, nickname, expectedStatus = 201) => {
    const response = await context.request.post(`${origin}${path}`, { data: { nickname } });
    assert(response.status() === expectedStatus, `POST ${path} returned ${response.status()}, expected ${expectedStatus}.`);
    return expectedStatus === 201 ? await response.json() : null;
  };

  const addSession = async (context, credentials) => {
    await context.addInitScript((session) => {
      localStorage.setItem('ceduljica:session', JSON.stringify(session));
    }, credentials);
  };

  const sendCommands = async (target, token, commands) => {
    await target.evaluate(async ({ sessionToken, roomCommands }) => {
      await new Promise((resolve, reject) => {
        const url = new URL('/ws', window.location.href);
        url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('token', sessionToken);
        const socket = new WebSocket(url);
        let commandIndex = 0;
        let waitingId = null;
        const timer = window.setTimeout(() => {
          socket.close();
          reject(new Error('Timed out sending browser WebSocket commands.'));
        }, 8000);
        const finish = () => {
          window.clearTimeout(timer);
          socket.close();
          resolve();
        };
        const next = () => {
          if (commandIndex >= roomCommands.length) {
            finish();
            return;
          }
          waitingId = `fixture-${commandIndex}-${Date.now()}`;
          socket.send(JSON.stringify({ id: waitingId, ...roomCommands[commandIndex] }));
        };
        socket.addEventListener('message', (event) => {
          const message = JSON.parse(String(event.data));
          if (message.type === 'snapshot' && waitingId === null) {
            next();
          } else if (message.type === 'ack' && message.id === waitingId) {
            commandIndex += 1;
            waitingId = null;
            next();
          } else if (message.type === 'error' && message.id === waitingId) {
            window.clearTimeout(timer);
            socket.close();
            reject(new Error(message.error?.message ?? 'WebSocket command failed.'));
          }
        });
        socket.addEventListener('error', () => {
          window.clearTimeout(timer);
          reject(new Error('Browser WebSocket connection failed.'));
        });
      });
    }, { sessionToken: token, roomCommands: commands });
  };

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin);
  await page.getByRole('button', { name: 'Sound on' }).click();
  await page.getByRole('button', { name: 'Muted' }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Muted' }).waitFor();

  const howToButton = page.getByRole('button', { name: 'How to use' });
  await howToButton.click();
  const dialog = page.getByRole('dialog', { name: 'How to use Ceduljica' });
  await dialog.waitFor();
  assert(await dialog.getByRole('button', { name: 'Close How to use Ceduljica' }).evaluate((node) => node === document.activeElement), 'How-to dialog did not receive initial focus.');
  await page.keyboard.press('Escape');
  assert(await howToButton.evaluate((node) => node === document.activeElement), 'Focus did not return to the How-to opener.');

  await page.getByLabel('Your display name').first().fill('Owner');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await page.getByRole('heading', { name: 'Bring your people in' }).waitFor();
  const invite = await page.getByLabel('Private invite link').inputValue();

  const browser = page.context().browser();
  assert(browser !== null, 'Browser handle was unavailable.');
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guestPage = await guestContext.newPage();
  await guestPage.goto(invite);
  await guestPage.getByLabel('Your display name').last().fill('Guest');
  await guestPage.getByRole('button', { name: 'Join room' }).click();
  await guestPage.getByRole('heading', { name: 'Bring your people in' }).waitFor();
  await page.getByText('2 of 12 people').waitFor();
  assert(await page.getByRole('button', { name: 'Begin writing' }).isEnabled(), 'Owner could not begin with two participants.');
  await noHorizontalOverflow(page, 'desktop lobby');
  await noHorizontalOverflow(guestPage, 'phone lobby');

  await page.getByRole('button', { name: 'Begin writing' }).click();
  await page.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await guestPage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  assert(await page.getByRole('heading', { name: 'Write one private note' }).evaluate((node) => node === document.activeElement), 'Phase heading did not receive focus after Begin.');

  const lateContext = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const latePage = await lateContext.newPage();
  await latePage.goto(invite);
  await latePage.getByLabel('Your display name').last().fill('Late Guest');
  await latePage.getByRole('button', { name: 'Join room' }).click();
  await latePage.getByRole('heading', { name: "You're in the next round" }).waitFor();

  await page.getByLabel('Your note').fill('owner first draft');
  await page.getByRole('button', { name: "I'm ready" }).click();
  await page.getByRole('heading', { name: /You're ready/ }).waitFor();
  await page.getByRole('button', { name: 'Edit note' }).click();
  await page.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await page.getByLabel('Your note').fill('owner private browser phrase');

  await guestPage.getByLabel('Your note').fill('guest private browser phrase');
  await guestPage.waitForTimeout(800);
  await guestPage.reload();
  await guestPage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  assert(await guestPage.getByLabel('Your note').inputValue() === 'guest private browser phrase', 'Reload did not restore the guest draft.');

  const guestSession = await sessionFrom(guestPage);
  const guestProjection = await guestContext.request.get(`${origin}/api/session`, {
    headers: { authorization: `Bearer ${guestSession.sessionToken}` },
  });
  const guestProjectionText = await guestProjection.text();
  assert(!guestProjectionText.includes('owner private browser phrase'), 'Guest projection disclosed the owner draft.');
  assert(!(await guestPage.content()).includes('owner private browser phrase'), 'Guest HTML disclosed the owner draft.');
  assert(!(await page.content()).includes('guest private browser phrase'), 'Owner HTML disclosed the guest draft.');

  await guestPage.getByRole('button', { name: "I'm ready" }).click();
  await guestPage.getByRole('heading', { name: /You're ready/ }).waitFor();
  await page.getByRole('button', { name: "I'm ready" }).click();
  await page.getByRole('heading', { name: 'Notes up!' }).waitFor();
  await guestPage.getByRole('heading', { name: 'Notes up!' }).waitFor();
  await latePage.getByRole('heading', { name: 'Notes up!' }).waitFor();
  await page.getByText('guest private browser phrase').waitFor();
  await guestPage.getByText('owner private browser phrase').waitFor();
  assert(await page.getByRole('heading', { name: 'Notes up!' }).evaluate((node) => node === document.activeElement), 'Reveal heading did not receive focus.');
  await noHorizontalOverflow(guestPage, 'phone reveal');

  await page.getByRole('button', { name: 'Start a new round' }).click();
  await page.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await guestPage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await latePage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  assert(!(await page.content()).includes('owner private browser phrase'), 'Replay retained a prior note in the active experience.');

  await page.getByRole('button', { name: 'Delete room' }).first().click();
  const deleteDialog = page.getByRole('dialog', { name: 'Delete this room?' });
  await deleteDialog.waitFor();
  assert(await deleteDialog.getByRole('button', { name: 'Keep room' }).evaluate((node) => node === document.activeElement), 'Safe delete action did not receive initial focus.');
  await deleteDialog.getByRole('button', { name: 'Delete room permanently' }).click();
  await guestPage.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();
  await page.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();

  const singleContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const singleOwner = await postSession(singleContext, '/api/rooms', 'Solo Owner');
  const singleGuest = await postSession(singleContext, `/api/rooms/${singleOwner.credentials.roomCode}/join`, 'Solo Guest');
  assert(singleGuest !== null, 'Single-note guest fixture was not created.');
  await addSession(singleContext, singleOwner.credentials);
  const singlePage = await singleContext.newPage();
  await singlePage.goto(`${origin}/room/${singleOwner.credentials.roomCode}`);
  await singlePage.getByRole('heading', { name: 'Bring your people in' }).waitFor();
  await singlePage.getByRole('button', { name: 'Begin writing' }).click();
  await singlePage.getByLabel('Your note').fill('the only revealed note');
  await singlePage.getByRole('button', { name: "I'm ready" }).click();
  await singlePage.getByRole('heading', { name: /You're ready/ }).waitFor();
  await singlePage.getByRole('button', { name: 'Remove Solo Guest' }).first().click();
  await singlePage.getByRole('heading', { name: 'Notes up!' }).waitFor();
  assert(await singlePage.locator('.note-board.notes-one > li').count() === 1, 'One-note reveal did not use the single-note layout.');
  await singlePage.getByText('the only revealed note').waitFor();
  await noHorizontalOverflow(singlePage, 'one-note desktop reveal');
  await singlePage.getByRole('button', { name: 'Delete room' }).click();
  await singlePage.getByRole('button', { name: 'Delete room permanently' }).click();

  const denseContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const denseOwner = await postSession(denseContext, '/api/rooms', 'Dense Owner');
  const denseSessions = [denseOwner];
  for (let index = 2; index <= 12; index += 1) {
    denseSessions.push(await postSession(denseContext, `/api/rooms/${denseOwner.credentials.roomCode}/join`, `Writer ${index}`));
  }
  await postSession(denseContext, `/api/rooms/${denseOwner.credentials.roomCode}/join`, 'Writer 13', 409);
  await addSession(denseContext, denseOwner.credentials);
  const densePage = await denseContext.newPage();
  await densePage.goto(`${origin}/room/${denseOwner.credentials.roomCode}`);
  await densePage.getByText('12 of 12 people').waitFor();
  await densePage.getByRole('button', { name: 'Begin writing' }).click();
  await densePage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  for (const [index, session] of denseSessions.entries()) {
    await sendCommands(densePage, session.credentials.sessionToken, [
      { type: 'save_draft', body: `Dense note ${index + 1}` },
      { type: 'ready' },
    ]);
  }
  await densePage.getByRole('heading', { name: 'Notes up!' }).waitFor();
  assert(await densePage.locator('.note-board.notes-dense > li').count() === 12, 'Dense reveal did not render 12 notes.');
  await densePage.getByText('12 notes · note 1 of 12 · scroll ↓').waitFor();
  await noHorizontalOverflow(densePage, 'dense phone reveal');
  await densePage.getByRole('button', { name: 'Delete room' }).click();
  await densePage.getByRole('button', { name: 'Delete room permanently' }).click();

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(origin);
  const motion = await reducedPage.locator('.app-shell').evaluate((node) => getComputedStyle(node).animationName);
  assert(motion === 'none', `Reduced motion left shell animation active: ${motion}.`);
  await noHorizontalOverflow(reducedPage, 'reduced-motion phone landing');

  await reducedContext.close();
  await denseContext.close();
  await singleContext.close();
  await lateContext.close();
  await guestContext.close();

  return {
    status: 'passed',
    scenarios: [
      'two-context lifecycle with late join, reconnect, privacy, replay, and deletion',
      'desktop one-note reveal',
      'phone twelve-note reveal and capacity rejection',
      'keyboard focus, persistent mute, reduced motion, and overflow checks',
    ],
  };
}
