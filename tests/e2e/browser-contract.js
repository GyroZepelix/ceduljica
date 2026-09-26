async (page) => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const origin = page.url().replace(/^(https?:\/\/[^/]+).*$/, '$1');
  const prefix = `.playwright-cli/02-02-${Date.now()}`;
  const screenshots = [];
  const geometry = [];
  const assets = [];
  const errors = [];
  const contrast = [];
  const readable = async (target, selector, label) => {
    const ratio = await target.locator(selector).first().evaluate(node => {
      const luminance = color => {
        const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
      };
      let backdrop = node;
      while (getComputedStyle(backdrop).backgroundColor === 'rgba(0, 0, 0, 0)') backdrop = backdrop.parentElement;
      const foreground = luminance(getComputedStyle(node).color);
      const background = luminance(getComputedStyle(backdrop).backgroundColor);
      return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
    });
    assert(ratio >= 4.5, `${label}: text contrast ${ratio}`);
    contrast.push({ label, ratio });
  };
  const observe = async (target) => {
    target.on('pageerror', error => errors.push(error.message));
    await target.addInitScript(() => {
      window.noteFlights = [];
      window.sentCommands = [];
      window.appSockets = [];
      const NativeSocket = window.WebSocket;
      window.WebSocket = class extends NativeSocket {
        constructor(...args) { super(...args); window.appSockets.push(this); }
        send(data) { window.sentCommands.push(JSON.parse(data)); super.send(data); }
      };
      document.addEventListener('animationstart', event => {
        if (event.animationName.startsWith('note-fly-')) window.noteFlights.push(event.animationName);
      });
    });
  };
  const capture = async (target, label) => {
    const path = `${prefix}-${label}.png`;
    await target.screenshot({ path, fullPage: true });
    screenshots.push(path);
  };
  const identity = async target => target.locator('.people-disclosure .person-row').evaluateAll(rows => rows.map(row => ({
    name: row.querySelector('strong').textContent.replace(' (you)', ''),
    slot: row.querySelector('.avatar').getAttribute('data-avatar-slot'),
  })));
  const centered = async (target, label) => {
    const bounds = await target.locator('.note-board').evaluate(board => {
      const box = board.getBoundingClientRect();
      const main = document.querySelector('.room-main');
      return { center: box.x + box.width / 2, viewport: innerWidth / 2, width: box.width, region: main.getBoundingClientRect().width, tracks: getComputedStyle(main).gridTemplateColumns };
    });
    assert(Math.abs(bounds.center - bounds.viewport) < 2, `${label}: board not centered ${JSON.stringify(bounds)}`);
    assert(!bounds.tracks.includes(' ') && Math.abs(bounds.width - bounds.region) < 2, `${label}: empty sidebar track`);
    geometry.push({ label, ...bounds });
  };
  const revealMatrix = async (target, label) => {
    await target.locator('.note-flight').waitFor({ state: 'detached' });
    for (const width of [1440, 390, 320]) {
      await target.setViewportSize({ width, height: 900 });
      await noHorizontalOverflow(target, `${label}-${width}`);
      await centered(target, `${label}-${width}`);
      await capture(target, `${label}-${width}`);
    }
  };
  await observe(page);

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
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    await noHorizontalOverflow(page, `landing-${width}`);
    await capture(page, `landing-${width}`);
    await howToButton.focus();
    await page.keyboard.press('Enter');
    for (const [index, scene] of ['create', 'invite', 'write', 'ready', 'reveal'].entries()) {
      const image = page.getByRole('dialog').getByRole('img');
      await image.evaluate(node => node.decode());
      const info = await image.evaluate(node => ({ src: node.currentSrc, width: node.naturalWidth, alt: node.alt }));
      assert(info.width === 1536 && info.alt.length > 10, `${scene}: image loading/semantics failed`);
      const response = await page.request.get(info.src);
      assert(response.status() === 200 && response.headers()['content-type'].includes('image/png'), `${scene}: built asset not served`);
      assets.push(info.src);
      await noHorizontalOverflow(page, `${scene}-${width}`);
      await page.keyboard.press('Shift+Tab');
      assert(await page.getByRole('dialog').evaluate(node => node.contains(document.activeElement)), 'Dialog focus escaped backwards');
      const action = page.getByRole('button', { name: index < 4 ? 'Next' : "Let's make notes", exact: true });
      await action.focus();
      await action.scrollIntoViewIfNeeded();
      await capture(page, `howto-${scene}-${width}`);
      await page.keyboard.press('Enter');
    }
    assert(await howToButton.evaluate(node => node === document.activeElement), 'Five-step dialog did not restore focus');
  }
  assert(new Set(assets).size === 5, 'Expected five distinct generated assets');
  await page.setViewportSize({ width: 1440, height: 900 });
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
  await observe(guestPage);
  await guestPage.goto(invite);
  await guestPage.getByLabel('Your display name').last().fill('Guest');
  await guestPage.getByRole('button', { name: 'Join room' }).click();
  await guestPage.getByRole('heading', { name: 'Bring your people in' }).waitFor();
  await page.getByText('2 of 12 people').waitFor();
  assert(await page.getByRole('button', { name: 'Begin writing' }).isEnabled(), 'Owner could not begin with two participants.');
  const firstRoundPrompt = 'What made you smile today?';
  const promptInput = page.getByLabel('Round prompt (optional)');
  assert(await promptInput.getAttribute('maxlength') === '200', 'Round prompt input did not expose the 200-character limit.');
  await promptInput.fill(`  ${firstRoundPrompt}  `);
  assert(await guestPage.getByRole('region', { name: 'Round prompt' }).count() === 0, 'Owner draft prompt leaked before the round began.');
  await noHorizontalOverflow(page, 'desktop lobby');
  await noHorizontalOverflow(guestPage, 'phone lobby');
  const initialIdentity = await identity(page);
  assert(JSON.stringify(initialIdentity) === JSON.stringify(await identity(guestPage)), 'Clients disagree on identity');
  await readable(page, '.owner-stamp', 'Owner stamp');
  await readable(page, '.person-copy', 'participant name/status');
  await capture(page, 'lobby-desktop');
  await capture(guestPage, 'lobby-phone');

  await page.getByRole('button', { name: 'Begin writing' }).click();
  await page.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await guestPage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await page.getByRole('region', { name: 'Round prompt' }).getByText(firstRoundPrompt, { exact: true }).waitFor();
  await guestPage.getByRole('region', { name: 'Round prompt' }).getByText(firstRoundPrompt, { exact: true }).waitFor();
  const beginPromptCommand = await page.evaluate(() => window.sentCommands.find(command => command.type === 'begin'));
  assert(beginPromptCommand?.prompt === firstRoundPrompt, 'Begin did not send the trimmed round prompt.');
  assert(await page.getByRole('heading', { name: 'Write one private note' }).evaluate((node) => node === document.activeElement), 'Phase heading did not receive focus after Begin.');

  const lateContext = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const latePage = await lateContext.newPage();
  await observe(latePage);
  await latePage.goto(invite);
  await latePage.getByLabel('Your display name').last().fill('Late Guest');
  await latePage.getByRole('button', { name: 'Join room' }).click();
  await latePage.getByRole('heading', { name: "You're in the next round" }).waitFor();
  await latePage.getByRole('region', { name: 'Round prompt' }).getByText(firstRoundPrompt, { exact: true }).waitFor();
  await capture(latePage, 'waiting-desktop');
  await latePage.setViewportSize({ width: 320, height: 800 });
  await noHorizontalOverflow(latePage, '320 waiting');
  await capture(latePage, 'waiting-phone');
  assert((await latePage.evaluate(() => window.noteFlights)).length === 0, 'Late join invented an entry flight');

  await page.getByLabel('Your note').fill('owner first draft');
  await page.getByRole('button', { name: "I'm ready" }).click();
  await page.getByRole('heading', { name: /You're ready/ }).waitFor();
  await page.getByRole('region', { name: 'Round prompt' }).getByText(firstRoundPrompt, { exact: true }).waitFor();
  await capture(page, 'ready-desktop');
  await page.setViewportSize({ width: 320, height: 800 });
  await noHorizontalOverflow(page, '320 ready');
  await capture(page, 'ready-phone');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Edit note' }).click();
  await page.getByRole('heading', { name: 'Write one private note' }).waitFor();
  assert(await page.getByLabel('Your note').evaluate(node => node === document.activeElement), 'Edit lost editor focus');
  await page.getByLabel('Your note').fill('owner private browser phrase');
  await readable(page, '.composer-note textarea', 'yellow note editor');
  await readable(page, '.counter', 'note counter');
  await capture(page, 'writing-desktop');
  await page.setViewportSize({ width: 320, height: 800 });
  await noHorizontalOverflow(page, '320 writing');
  await capture(page, 'writing-phone');
  await page.setViewportSize({ width: 1440, height: 900 });
  assert((await page.evaluate(() => window.noteFlights)).filter(name => name === 'note-fly-in').length === 1, 'Snapshot or Ready/Edit duplicated entry flight');

  await guestPage.bringToFront();
  await guestPage.getByLabel('Your note').fill('guest private browser phrase');
  await guestPage.waitForTimeout(1500); // Allow the 600 ms debounce, including background-tab timer throttling.
  const savedGuest = await sessionFrom(guestPage);
  const savedProjection = await guestContext.request.get(`${origin}/api/session`, { headers: { authorization: `Bearer ${savedGuest.sessionToken}` } });
  assert((await savedProjection.json()).ownNote.body === 'guest private browser phrase', 'Debounced guest draft was not persisted before reload.');
  await guestPage.reload();
  await guestPage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  assert(await guestPage.getByLabel('Your note').inputValue() === 'guest private browser phrase', 'Reload did not restore the saved guest draft.');

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
  await page.getByRole('region', { name: 'Round prompt' }).getByText(firstRoundPrompt, { exact: true }).waitFor();
  await guestPage.getByRole('region', { name: 'Round prompt' }).getByText(firstRoundPrompt, { exact: true }).waitFor();
  await latePage.getByRole('region', { name: 'Round prompt' }).getByText(firstRoundPrompt, { exact: true }).waitFor();
  const nextPromptInput = page.getByLabel('Round prompt (optional)');
  assert(await nextPromptInput.inputValue() === '', 'Next-round prompt input inherited the completed prompt.');
  assert(await page.getByRole('heading', { name: 'Notes up!' }).evaluate((node) => node === document.activeElement), 'Reveal heading did not receive focus.');
  await noHorizontalOverflow(guestPage, 'phone reveal');
  assert((await latePage.evaluate(() => window.noteFlights)).length === 0, 'Late join invented a personal reveal flight');
  assert(await page.locator('textarea').count() === 0, 'Reveal left a stale editor');
  const readyCommands = await page.evaluate(() => window.sentCommands.filter(command => command.type === 'ready').length);
  assert(readyCommands === 2, `Expected one command per Ready press, got ${readyCommands}`);
  await revealMatrix(page, 'reveal-two');
  await page.setViewportSize({ width: 1440, height: 900 });

  const secondRoundPrompt = 'Name one small win.';
  await nextPromptInput.fill(`  ${secondRoundPrompt}  `);
  await page.getByRole('button', { name: 'Start a new round' }).click();
  await page.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await guestPage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await latePage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  await page.getByRole('region', { name: 'Round prompt' }).getByText(secondRoundPrompt, { exact: true }).waitFor();
  await guestPage.getByRole('region', { name: 'Round prompt' }).getByText(secondRoundPrompt, { exact: true }).waitFor();
  await latePage.getByRole('region', { name: 'Round prompt' }).getByText(secondRoundPrompt, { exact: true }).waitFor();
  const replayPromptCommand = await page.evaluate(() => window.sentCommands.find(command => command.type === 'replay'));
  assert(replayPromptCommand?.prompt === secondRoundPrompt, 'Replay did not send the trimmed new prompt.');
  assert(!(await page.content()).includes('owner private browser phrase'), 'Replay retained a prior note in the active experience.');

  assert(await page.locator('.note-flight-out').count() === 0, 'Replay retained outgoing decoration');
  await page.getByRole('button', { name: 'Delete room' }).first().click();
  const deleteDialog = page.getByRole('dialog', { name: 'Delete this room?' });
  await deleteDialog.waitFor();
  assert(await deleteDialog.getByRole('button', { name: 'Keep room' }).evaluate((node) => node === document.activeElement), 'Safe delete action did not receive initial focus.');
  await page.keyboard.press('Escape');
  assert(await page.getByRole('button', { name: 'Delete room' }).first().evaluate(node => node === document.activeElement), 'Delete modal did not restore opener focus');
  await page.getByRole('button', { name: 'Delete room' }).first().click();
  await deleteDialog.getByRole('button', { name: 'Delete room permanently' }).click();
  await guestPage.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();
  await page.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();

  assert(await page.locator('.note-flight').count() === 0, 'Terminal event retained decoration');
  await capture(page, 'terminal-desktop');
  await page.setViewportSize({ width: 320, height: 800 });
  await noHorizontalOverflow(page, '320 terminal');
  await capture(page, 'terminal-phone');

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
  await revealMatrix(singlePage, 'reveal-one');
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
  const denseBefore = await identity(densePage);
  assert(new Set(denseBefore.map(person => person.slot)).size === 12, 'Full room avatars collide');
  const removed = denseSessions.pop();
  await sendCommands(densePage, denseOwner.credentials.sessionToken, [{ type: 'remove', participantId: removed.credentials.participantId }]);
  denseSessions.push(await postSession(denseContext, `/api/rooms/${denseOwner.credentials.roomCode}/join`, 'Replacement'));
  await sendCommands(densePage, denseSessions[11].credentials.sessionToken, []);
  await densePage.getByText('Replacement', { exact: true }).first().waitFor({ state: 'attached' });
  const denseAfter = await identity(densePage);
  assert(JSON.stringify(denseBefore.slice(0, 11)) === JSON.stringify(denseAfter.slice(0, 11)), 'Removal/join recolored survivors');
  assert(new Set(denseAfter.map(person => person.slot)).size === 12, 'Replacement did not receive a unique free slot');
  const peerContext = await browser.newContext();
  await addSession(peerContext, denseSessions[11].credentials);
  const peer = await peerContext.newPage();
  await peer.goto(`${origin}/room/${denseOwner.credentials.roomCode}`);
  await peer.getByRole('heading', { name: 'Bring your people in' }).waitFor();
  assert(JSON.stringify(await identity(peer)) === JSON.stringify(denseAfter), 'Twelve avatars disagree across clients');
  await densePage.reload();
  await densePage.getByRole('heading', { name: 'Bring your people in' }).waitFor();
  assert(JSON.stringify(await identity(densePage)) === JSON.stringify(denseAfter), 'Reload changed twelve identities');
  await densePage.locator('.people-disclosure summary').click();
  await noHorizontalOverflow(densePage, 'twelve-avatar phone disclosure');
  await capture(densePage, 'avatars-phone');
  await densePage.locator('.people-disclosure summary').click();
  await densePage.setViewportSize({ width: 1440, height: 1000 });
  await capture(densePage, 'avatars-desktop');
  await densePage.getByRole('button', { name: 'Begin writing' }).click();
  await densePage.getByRole('heading', { name: 'Write one private note' }).waitFor();
  for (const [index, session] of denseSessions.entries()) {
    await sendCommands(densePage, session.credentials.sessionToken, [
      { type: 'save_draft', body: index === 0 ? 'x'.repeat(500) : index === 1 ? ('A long readable note.\n'.repeat(25)).slice(0, 500) : `Dense note ${index + 1}` },
      { type: 'ready' },
    ]);
  }
  await densePage.getByRole('heading', { name: 'Notes up!' }).waitFor();
  assert(await densePage.locator('.note-board.notes-dense > li').count() === 12, 'Dense reveal did not render 12 notes.');
  const authors = await densePage.locator('.note-board footer').evaluateAll(nodes => nodes.map(node => ({ name: node.querySelector('span').textContent, slot: node.querySelector('.avatar').getAttribute('data-avatar-slot') })));
  assert(JSON.stringify(authors) === JSON.stringify(denseAfter), 'Reveal identity/order differs, including disconnected ready authors');
  await revealMatrix(densePage, 'reveal-twelve');
  await densePage.getByText('12 notes · note 1 of 12 · scroll ↓').waitFor();
  await noHorizontalOverflow(densePage, 'dense phone reveal');
  await peer.reload();
  await peer.getByRole('heading', { name: 'Notes up!' }).waitFor();
  assert(JSON.stringify(await identity(peer)) === JSON.stringify(denseAfter), 'Reconnect changed twelve identities');
  await densePage.getByRole('button', { name: 'Start a new round' }).click();
  await densePage.getByLabel('Your note').waitFor();
  assert(JSON.stringify(await identity(densePage)) === JSON.stringify(denseAfter), 'Replay changed twelve identities');
  assert(await densePage.getByLabel('Your note').inputValue() === '', 'Replay retained long private content');
  await densePage.getByRole('button', { name: 'Delete room' }).click();
  await densePage.getByRole('button', { name: 'Delete room permanently' }).click();

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reducedContext.newPage();
  await observe(reducedPage);
  await reducedPage.goto(origin);
  const motion = await reducedPage.locator('.app-shell').evaluate((node) => getComputedStyle(node).animationName);
  assert(motion === 'none', `Reduced motion left shell animation active: ${motion}.`);
  await noHorizontalOverflow(reducedPage, 'reduced-motion phone landing');

  // Real sockets and authoritative updates deliberately interrupt active flights.
  const interruptContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const interruptOwner = await postSession(interruptContext, '/api/rooms', 'Motion Owner');
  const interruptGuest = await postSession(interruptContext, `/api/rooms/${interruptOwner.credentials.roomCode}/join`, 'Motion Guest');
  await addSession(interruptContext, interruptOwner.credentials);
  await addSession(reducedContext, interruptGuest.credentials);
  const interruptPage = await interruptContext.newPage();
  await observe(interruptPage);
  await interruptPage.goto(`${origin}/room/${interruptOwner.credentials.roomCode}`);
  await reducedPage.goto(`${origin}/room/${interruptOwner.credentials.roomCode}`);
  await reducedPage.getByRole('heading', { name: 'Bring your people in' }).waitFor();
  await interruptPage.getByRole('button', { name: 'Begin writing' }).click();
  await interruptPage.locator('.note-flight-in').waitFor({ state: 'attached' });
  await interruptPage.evaluate(() => window.appSockets[0].close());
  await interruptPage.getByText('Connection lost — trying again', { exact: false }).first().waitFor();
  assert(await interruptPage.locator('.note-flight').count() === 0, 'Disconnect failed to interrupt entry');
  await interruptPage.locator('.connection-banner').waitFor({ state: 'detached' });
  assert(await interruptPage.locator('.note-flight').count() === 0, 'Reconnect replayed a stale entry');
  assert(await reducedPage.locator('.note-flight').count() === 0, 'Reduced motion animated entry');
  await interruptPage.getByLabel('Your note').fill('Interrupted flight, preserved draft');
  await interruptPage.getByRole('button', { name: "I'm ready" }).click();
  await interruptPage.getByRole('heading', { name: /You're ready/ }).waitFor();
  await reducedPage.getByLabel('Your note').fill('Instant reduced-motion note');
  await reducedPage.getByRole('button', { name: "I'm ready" }).click();
  await interruptPage.locator('.note-flight-out').waitFor({ state: 'attached' });
  assert(await interruptPage.getByRole('heading', { name: 'Notes up!' }).evaluate(node => node === document.activeElement), 'Active exit delayed reveal focus');
  assert(await interruptPage.locator('textarea').count() === 0, 'Active exit retained an editor');
  await sendCommands(interruptPage, interruptOwner.credentials.sessionToken, [{ type: 'replay' }]);
  await interruptPage.getByLabel('Your note').waitFor();
  assert(await interruptPage.locator('.note-flight-out').count() === 0, 'Authoritative replay did not interrupt exit');
  assert(await interruptPage.getByLabel('Your note').inputValue() === '', 'Replay kept old private draft');
  await interruptPage.locator('.note-flight-in').waitFor({ state: 'attached' });
  await sendCommands(interruptPage, interruptOwner.credentials.sessionToken, [{ type: 'delete_room' }]);
  await interruptPage.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();
  assert(await interruptPage.locator('.note-flight').count() === 0, 'Authoritative deletion did not interrupt entry');
  await reducedPage.getByRole('heading', { name: 'This room was deleted by its owner.' }).waitFor();
  assert((await reducedPage.evaluate(() => window.noteFlights)).length === 0, 'Reduced-motion lifecycle emitted flights');
  await interruptContext.close();
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  await peerContext.close();
  await reducedContext.close();
  await denseContext.close();
  await singleContext.close();
  await lateContext.close();
  await guestContext.close();

  return {
    status: 'passed',
    screenshots, geometry, contrast, assets: [...new Set(assets)], browserErrors: errors,
    nativeZoom: 'Pending separate actual browser-menu 200% user inspection; no emulation claimed.',
    scenarios: [
      'two-context lifecycle with late join, reconnect, privacy, replay, and deletion',
      'desktop one-note reveal',
      'phone twelve-note reveal and capacity rejection',
      'keyboard focus, persistent mute, rendered text contrast, reduced motion, and overflow checks',
      'active entry interrupted by socket disconnect, active exit interrupted by authoritative replay, active entry interrupted by deletion',
    ],
  };
}
