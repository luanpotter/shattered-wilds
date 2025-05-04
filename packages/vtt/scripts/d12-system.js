// Register the chat command
Hooks.once('init', () => {
    // Register the command with Foundry's command system
    game.commands.register('d12', 'd12', async function(messageText, chatData) {
        // Remove leading /d12
        const cmd = messageText.slice(4).trim().split(/\s+/);

        // Parse flags
        let mod = 0;
        let extra = false;
        let luck = false;
        let contested = false;
        let target = null;

        for (let i = 0; i < cmd.length; i++) {
            const tk = cmd[i].toLowerCase();
            if (/^[+-]\d+$/.test(tk)) mod += Number(tk);
            else if (tk === "extra") extra = true;
            else if (tk === "luck") luck = true;
            else if (tk === "vs") {
                contested = true;
                const val = Number(cmd[i+1]);
                if (!isNaN(val)) {
                    target = val;
                    i++;
                }
            }
            else if (/^dc$/.test(tk)) {
                contested = false;
                const val = Number(cmd[i+1]);
                if (!isNaN(val)) { target = val; i++; }
            }
        }

        // Determine dice pool size
        let pool = 2;
        if (extra) pool++;
        if (luck) pool++;
        pool = Math.min(pool, 4);

        // Roll dice
        const formula = `${pool}d12`;
        const roll = await (new Roll(formula)).evaluate({async: true});
        const raw = roll.dice[0].results.map(r => r.result);

        // Auto-fail on any pair of 1s
        const ones = raw.filter(n => n === 1).length;
        if (ones >= 2) {
            await game.dice3d?.showForRoll(roll, game.user, true);
            return ChatMessage.create({
                speaker: ChatMessage.getSpeaker(),
                content: `<p><strong>Auto-Fail!</strong> Rolled double 1s among [${raw.join(", ")}].</p>`,
                type: CONST.CHAT_MESSAGE_TYPES.OOC
            });
        }

        // Filter valid extras and luck
        // (Skipping attribute checks--assume valid for now)

        // Pick best two dice
        const sorted = [...raw].sort((a,b)=>b-a);
        const [d1, d2] = sorted;
        let baseTotal = d1 + d2 + mod;

        // Crit bonus calculation
        let critBonus = 0;
        if (raw.includes(12)) critBonus += 6;
        const pairs = raw.reduce((acc,n,i,arr)=>acc + (arr.indexOf(n)!==i && arr.filter(x=>x===n).length>=2?1:0),0);
        if (pairs>0) critBonus += 6;

        // Show 3D dice
        await game.dice3d?.showForRoll(roll, game.user, true);

        // Build result
        let content = `<p><strong>D12 Roll</strong> [${raw.join(", ")}] + (${mod>=0?"+":""}${mod}) => <em>${d1}+${d2}+${mod} = ${baseTotal}</em></p>`;
        if (critBonus>0 && contested) content += `<p>Crit Bonus: +${critBonus}</p>`;

        if (contested) {
            // Passive roll
            const pRoll = await (new Roll(`2d12`)).evaluate({async:true});
            const pRaw = pRoll.dice[0].results.map(r=>r.result).sort((a,b)=>b-a);
            const pTotal = pRaw[0]+pRaw[1];
            await game.dice3d?.showForRoll(pRoll, game.user, true);
            // Active total for contest
            const activeContest = baseTotal + (critBonus>0?critBonus:0);
            const success = activeContest > pTotal;
            const diff = Math.abs(activeContest - pTotal);
            content += `<p>Passive rolled [${pRaw.join(", ")}] = ${pTotal}</p>`;
            content += success
                ? `<p><strong>Success!</strong> (${activeContest} vs ${pTotal})</p>`
                : `<p><strong>Failure.</strong> (${activeContest} vs ${pTotal})</p>`;
            // Crit count
            if (success && critBonus>0) {
                const crits = critBonus/6;
                content += `<p>Crits awarded: ${crits}</p>`;
            }
        }
        else if (target !== null) {
            // Static DC check
            const dcTotal = baseTotal;
            const success = dcTotal >= target;
            content += success
                ? `<p><strong>Success!</strong> (${dcTotal} vs DC ${target})</p>`
                : `<p><strong>Failure.</strong> (${dcTotal} vs DC ${target})</p>`;
        }

        // Create chat message
        return ChatMessage.create({
            speaker: ChatMessage.getSpeaker(),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL
        });
    });
});

// Register the command when Foundry is ready
Hooks.once('ready', () => {
    // Register the command with Foundry
    const command = game.settings.get('d12-system', 'command');
    if (!game.settings.get('d12-system', 'commandRegistered')) {
        game.settings.register('d12-system', 'commandRegistered', {
            name: 'D12 Command Registered',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false
        });
        game.settings.set('d12-system', 'commandRegistered', true);
    }
});

// Register the chat command handler
Hooks.on('chatMessage', async (chatLog, messageText, chatData) => {
  if (!messageText.startsWith("/d12")) return;
  
  // Prevent default chat handler
  chatData.preventDefault = true;
  
  // Clear the chat input
  const chatInput = document.querySelector("#chat-message");
  if (chatInput) chatInput.value = "";
  
  // Remove leading /d12
  const cmd = messageText.slice(4).trim().split(/\s+/);

  // Parse flags
  let mod = 0;
  let extra = false;
  let luck = false;
  let contested = false;
  let target = null;

  for (let i = 0; i < cmd.length; i++) {
    const tk = cmd[i].toLowerCase();
    if (/^[+-]\d+$/.test(tk)) mod += Number(tk);
    else if (tk === "extra") extra = true;
    else if (tk === "luck") luck = true;
    else if (tk === "vs") {
      contested = true;
      const val = Number(cmd[i+1]);
      if (!isNaN(val)) {
        target = val;
        i++;
      }
    }
    else if (/^dc$/.test(tk)) {
      contested = false;
      const val = Number(cmd[i+1]);
      if (!isNaN(val)) { target = val; i++; }
    }
  }

  // Determine dice pool size
  let pool = 2;
  if (extra) pool++;
  if (luck) pool++;
  pool = Math.min(pool, 4);

  // Roll dice
  const formula = `${pool}d12`;
  const roll = await (new Roll(formula)).evaluate({async: true});
  const raw = roll.dice[0].results.map(r => r.result);

  // Auto-fail on any pair of 1s
  const ones = raw.filter(n => n === 1).length;
  if (ones >= 2) {
    await game.dice3d?.showForRoll(roll, game.user, true);
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({user: chatData.user}),
      content: `<p><strong>Auto-Fail!</strong> Rolled double 1s among [${raw.join(", ")}].</p>`,
      type: CONST.CHAT_MESSAGE_TYPES.OOC
    });
  }

  // Filter valid extras and luck
  // (Skipping attribute checks--assume valid for now)

  // Pick best two dice
  const sorted = [...raw].sort((a,b)=>b-a);
  const [d1, d2] = sorted;
  let baseTotal = d1 + d2 + mod;

  // Crit bonus calculation
  let critBonus = 0;
  if (raw.includes(12)) critBonus += 6;
  const pairs = raw.reduce((acc,n,i,arr)=>acc + (arr.indexOf(n)!==i && arr.filter(x=>x===n).length>=2?1:0),0);
  if (pairs>0) critBonus += 6;

  // Show 3D dice
  await game.dice3d?.showForRoll(roll, game.user, true);

  // Build result
  let content = `<p><strong>D12 Roll</strong> [${raw.join(", ")}] + (${mod>=0?"+":""}${mod}) => <em>${d1}+${d2}+${mod} = ${baseTotal}</em></p>`;
  if (critBonus>0 && contested) content += `<p>Crit Bonus: +${critBonus}</p>`;

  if (contested) {
    // Passive roll
    const pRoll = await (new Roll(`2d12`)).evaluate({async:true});
    const pRaw = pRoll.dice[0].results.map(r=>r.result).sort((a,b)=>b-a);
    const pTotal = pRaw[0]+pRaw[1];
    await game.dice3d?.showForRoll(pRoll, game.user, true);
    // Active total for contest
    const activeContest = baseTotal + (critBonus>0?critBonus:0);
    const success = activeContest > pTotal;
    const diff = Math.abs(activeContest - pTotal);
    content += `<p>Passive rolled [${pRaw.join(", ")}] = ${pTotal}</p>`;
    content += success
      ? `<p><strong>Success!</strong> (${activeContest} vs ${pTotal})</p>`
      : `<p><strong>Failure.</strong> (${activeContest} vs ${pTotal})</p>`;
    // Crit count
    if (success && critBonus>0) {
      const crits = critBonus/6;
      content += `<p>Crits awarded: ${crits}</p>`;
    }
  }
  else if (target !== null) {
    // Static DC check
    const dcTotal = baseTotal;
    const success = dcTotal >= target;
    content += success
      ? `<p><strong>Success!</strong> (${dcTotal} vs DC ${target})</p>`
      : `<p><strong>Failure.</strong> (${dcTotal} vs DC ${target})</p>`;
  }

  // Create chat message
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({user: chatData.user}),
    content: content,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  });

  return false;
});