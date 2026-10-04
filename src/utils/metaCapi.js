const bizSdk = require('facebook-nodejs-business-sdk');
const ServerEvent = bizSdk.ServerEvent;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const CustomData = bizSdk.CustomData;
const crypto = require('crypto');

const PIXEL_ID = '839009299208301';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

function hash(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

async function sendCapiEvent({ eventName, eventId, userData = {}, customData = {}, eventSourceUrl, clientIpAddress, clientUserAgent, optOut = false }) {
  // CCPA/CPRA "Do Not Sell or Share" (C-009): skip when the request carried a
  // GPC signal / lo_optout cookie (caller passes optOut), or when this email is
  // on the privacy_optouts list (from the /do-not-sell-or-share form).
  if (optOut) return;
  try {
    const { isEmailOptedOut } = require('./privacyOptOut');
    if (userData && userData.email && await isEmailOptedOut(userData.email)) return;
  } catch (_) { /* never block on the opt-out lookup */ }

  if (!ACCESS_TOKEN) {
    console.warn('META_CAPI_ACCESS_TOKEN not set — skipping CAPI event:', eventName);
    return;
  }

  try {
    bizSdk.FacebookAdsApi.init(ACCESS_TOKEN);

    const user = new UserData();
    if (userData.email) user.setEmail(hash(userData.email));
    if (userData.phone) user.setPhone(hash(userData.phone));
    if (userData.firstName) user.setFirstName(hash(userData.firstName));
    if (userData.lastName) user.setLastName(hash(userData.lastName));
    if (clientIpAddress) user.setClientIpAddress(clientIpAddress);
    if (clientUserAgent) user.setClientUserAgent(clientUserAgent);

    const event = new ServerEvent();
    event.setEventName(eventName);
    event.setEventTime(Math.floor(Date.now() / 1000));
    event.setUserData(user);
    event.setEventSourceUrl(eventSourceUrl || 'https://legacyodyssey.com');
    event.setActionSource('website');
    if (eventId) event.setEventId(eventId);

    if (customData && Object.keys(customData).length > 0) {
      const cd = new CustomData();
      if (customData.value) cd.setValue(customData.value);
      if (customData.currency) cd.setCurrency(customData.currency);
      if (customData.orderId) cd.setOrderId(customData.orderId);
      event.setCustomData(cd);
    }

    const request = new EventRequest(ACCESS_TOKEN, PIXEL_ID);
    request.setEvents([event]);
    await request.execute();

    console.log(`CAPI event sent: ${eventName} (id: ${eventId})`);
  } catch (err) {
    // Never let CAPI errors break the user-facing flow
    console.error('CAPI error (non-fatal):', err.message);
  }
}

module.exports = { sendCapiEvent };
