// src/errors.js
//
// Turns a raw API failure into something a human can act on.
// Provider SDKs surface errors inconsistently — sometimes a status code,
// sometimes a JSON blob stuffed into error.message — so we sniff both.
//
// `modelName` is only used to make the message specific; omit it if unknown.
export const describeError = (error, modelName = '') => {
  const raw = error?.message || String(error);

  // The Google SDK often throws with the whole JSON response as the message.
  let payload = null;
  try {
    const jsonStart = raw.indexOf('{');
    if (jsonStart !== -1) payload = JSON.parse(raw.slice(jsonStart));
  } catch {
    // Not JSON — fall through to string matching below.
  }

  const status = error?.status ?? payload?.error?.status ?? error?.code ?? payload?.error?.code;
  const detail = payload?.error?.message || raw;
  const model = modelName ? `**${modelName}**` : 'that model';

  const isQuota = status === 429 || status === 'RESOURCE_EXHAUSTED' || /quota|rate.?limit|exceeded/i.test(detail);
  const isAuth = status === 401 || status === 403 || status === 'PERMISSION_DENIED' ||
    status === 'UNAUTHENTICATED' || /api key|unauthorized|permission denied|invalid.*credential/i.test(detail);
  const isBadModel = status === 404 || status === 'NOT_FOUND' ||
    /not found|does not exist|unsupported model|not a valid model|invalid model/i.test(detail);
  const isSafety = (status === 'INVALID_ARGUMENT' && /safety|blocked/i.test(detail)) || /safety|blocked by/i.test(detail);
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const isNetwork = !isOffline && (error instanceof TypeError || /failed to fetch|networkerror/i.test(raw));

  if (isOffline) {
    return "📡 You appear to be offline. Check your connection and try again.";
  }
  if (isNetwork) {
    return "📡 Couldn't reach the API. This is usually a network hiccup or an ad blocker — check your connection and try again.";
  }
  if (isQuota) {
    // Google returns a machine-readable retry hint; surface it when present.
    const retrySeconds =
      Math.ceil(Number(payload?.error?.details?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay?.replace('s', ''))) ||
      Math.ceil(Number(detail.match(/retry in ([\d.]+)s/i)?.[1]));
    const waitHint = Number.isFinite(retrySeconds) && retrySeconds > 0
      ? ` Try again in about ${retrySeconds < 60 ? `${retrySeconds} seconds` : `${Math.ceil(retrySeconds / 60)} minutes`}.`
      : ' Try again in a minute.';
    return `🍌 Rate limit reached — the free tier for ${model} is used up.${waitHint}\n\n` +
      `You can switch provider or model in ⚙️ Settings, or check your quota at ` +
      `[Google AI Studio](https://aistudio.google.com/apikey).`;
  }
  if (isAuth) {
    return "🔑 That API key was rejected. Open ⚙️ Settings to check it — make sure it matches the provider you selected and hasn't been revoked.";
  }
  if (isBadModel) {
    return `🤖 The model ${model} wasn't found or isn't available to your key. Pick a different one in ⚙️ Settings.`;
  }
  if (isSafety) {
    return "🛡️ That prompt was blocked by the provider's safety filters. Try rephrasing it.";
  }

  // Unknown failure: show the cleaned-up message, not the raw JSON dump.
  const readable = detail.length > 300 ? `${detail.slice(0, 300)}…` : detail;
  return `😵 Something went wrong: ${readable}`;
};
