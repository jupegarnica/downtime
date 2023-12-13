
type Options = RequestInit & { timeout?: number, sleep?: number };

const fetchInitDefault: Options = {
  method: 'GET',
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'omit',
  headers: {
    'Content-Type': 'application/json',
  },
  redirect: 'follow',
  referrerPolicy: 'no-referrer',
  timeout: 5000,
  sleep: 1000,
};

type YieldedData = {
  request: Request,
  requestsCount: number,

  responses: Response[],
  errors: Error[],
  responseTimes: number[],

  lastResponseTime: number,
  lastResponse: Response | null,
  lastError: Error | null,

  totalUpTimeElapsed: number,
  totalDownTimeElapsed: number,
  downTimeTimes: number,


};


export async function* checkDownTime(url: string, fetchInit: Options): AsyncGenerator<YieldedData, YieldedData, YieldedData> {
  const options = { ...fetchInitDefault, ...fetchInit };
  let aborted = false;

  const generatorController = new AbortController();
  if (fetchInit.signal) {
    fetchInit.signal.addEventListener('abort', () => { aborted = true; generatorController.abort('generator end'); });
  }
  let totalUpTimeElapsed = 0;
  let totalDownTimeElapsed = 0;

  let lastDownTimeElapsed = 0;
  let lastDownTimeStart = 0;

  let lastUpTimeElapsedStart = 0;
  let lastUpTimeElapsed = 0;

  let downTimeTimes = 0;

  let data: YieldedData = {
    request: new Request(url),
    requestsCount: 0,
    responses: [],
    errors: [],

    responseTimes: [],
    lastResponseTime: 0,
    lastResponse: null,
    lastError: null,

    totalUpTimeElapsed,
    totalDownTimeElapsed,
    downTimeTimes,

  };

  while (!aborted) {
    let timeoutId  = 0 ;
    try {
      const fetchController = new AbortController();
      if (options.timeout) {
        timeoutId = setTimeout(() => { fetchController.abort('timed out: ' + options.timeout) }, options.timeout);
      }
      const request = new Request(url, { ...options, signal: fetchController.signal, });
      data.request = request;
      data.requestsCount++;

      const nowBeforeFetch = Date.now();
      const response = await fetch(request);
      const nowAfterResponse = Date.now();
      await response.body?.cancel();

      // update totalUpTimeElapsed
      lastUpTimeElapsedStart ||= nowAfterResponse;
      lastUpTimeElapsed = nowAfterResponse - lastUpTimeElapsedStart;
      data.totalUpTimeElapsed = totalUpTimeElapsed + lastUpTimeElapsed;


      // update responseTimes
      data.lastResponseTime = nowAfterResponse - nowBeforeFetch;
      data.responseTimes.push(data.lastResponseTime);

      // update responses
      data.lastResponse = response;
      data.responses.push(response);
      data.lastError = null;

      // update totalDownTimeElapsed
      if (lastDownTimeStart) {
        lastDownTimeElapsed = nowAfterResponse - lastDownTimeStart;
        totalDownTimeElapsed += lastDownTimeElapsed;
        lastDownTimeStart = 0;
        data.totalDownTimeElapsed = totalDownTimeElapsed;
      }

    } catch (error) {
      const nowAfterError = Date.now();

      // update totalUpTimeElapsed


      // update downTime
      lastDownTimeStart || downTimeTimes++;
      lastDownTimeStart = lastDownTimeStart || nowAfterError;
      lastDownTimeElapsed = nowAfterError - lastDownTimeStart;
      data.lastError = error;
      data.errors.push(error);
      data.lastResponse = null;
      data.totalDownTimeElapsed = totalDownTimeElapsed + lastDownTimeElapsed;
      data.downTimeTimes = downTimeTimes;



    } finally {
      if (options.sleep) {
        await new Promise((resolve) => setTimeout(resolve, options.sleep));
      }
      clearTimeout(timeoutId);
      yield data;
    }
  }
  return data;
}
