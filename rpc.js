const { Client } = require('@xhayper/discord-rpc');

let client;
let activityInterval;
const CLIENT_ID = '1121012692623310858';

function getDefaultActivity() {
  return {
    details: 'Navigation',
    state: "Page d'accueil",
    startTimestamp: Date.now(),
    largeImageKey: 'wouaff_logo',
    largeImageText: 'Wouaff Browser',
    instance: false,
  };
}

async function start() {
  if (!CLIENT_ID || CLIENT_ID === '1121012692623310858') return;

  client = new Client({ clientId: CLIENT_ID });

  client.on('ready', () => {
    setActivity(getDefaultActivity());
    activityInterval = setInterval(() => {
      setActivity(getDefaultActivity());
    }, 15000);
  });

  try {
    await client.login();
  } catch {
    client = null;
  }
}

async function setActivity(activity) {
  if (!client || !client.isConnected) return;
  try {
    await client.request('SET_ACTIVITY', {
      pid: process.pid,
      activity,
    });
  } catch {}
}

async function updateActivity(tabTitle, tabUrl) {
  if (!client || !client.isConnected) return;
  await setActivity({
    details: tabTitle ? tabTitle.slice(0, 128) : 'Navigation',
    state: tabUrl ? tabUrl.slice(0, 128) : "Page d'accueil",
    startTimestamp: Date.now(),
    largeImageKey: 'wouaff_logo',
    largeImageText: 'Wouaff Browser',
    instance: false,
  });
}

async function stop() {
  if (activityInterval) clearInterval(activityInterval);
  if (client) {
    try { await client.destroy(); } catch {}
    client = null;
  }
}

module.exports = { start, stop, updateActivity };
