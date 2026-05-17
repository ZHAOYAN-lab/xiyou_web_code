import axios from 'axios';

const DEFAULT_CLE_TIMEOUT = 30000;

const cleHttp = axios.create({
  timeout: DEFAULT_CLE_TIMEOUT
});

const normalizeBaseUrl = (baseUrl) => String(baseUrl || '').replace(/\/+$/, '');
const getRequestTimeout = (data, requestTimeout) => {
  if (Number.isFinite(requestTimeout) && requestTimeout > 0) return requestTimeout;

  const payloadTimeout = Number(data && data.timeout);
  if (Number.isFinite(payloadTimeout) && payloadTimeout > 0) {
    return Math.max(DEFAULT_CLE_TIMEOUT, (payloadTimeout + 5) * 1000);
  }

  return DEFAULT_CLE_TIMEOUT;
};

export function beaconLightTaskTestInfo(baseUrl) {
  return cleHttp.get(`${normalizeBaseUrl(baseUrl)}/info`);
}

export function beaconLightTaskSendMessage(baseUrl, data, requestTimeout) {
  return cleHttp.post(`${normalizeBaseUrl(baseUrl)}/beacons/message`, data, {
    timeout: getRequestTimeout(data, requestTimeout),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export default {
  beaconLightTaskTestInfo,
  beaconLightTaskSendMessage
};
