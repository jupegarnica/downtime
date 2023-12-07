
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
  timeout: 1000,
  sleep: 0,
};

export async function* checkDownTime(url: string, fetchInit: Options) {
  const options = { ...fetchInitDefault, ...fetchInit };
  let aborted = false;

  let controller = new AbortController();
  if (fetchInit.signal) {
    fetchInit.signal.addEventListener('abort', () => { aborted = true; controller.abort(); });
  }

  let downTimeElapsed = 0;
  let downTimeTimes = 0;
  let downTimeStart = 0;

  while (!aborted) {
    try {
      controller = new AbortController();
      if (options.timeout) {
        setTimeout(() => { controller.abort() }, options.timeout);
      }
      const response = await fetch(url, { ...options, signal: controller.signal });

      if (downTimeStart) {

        downTimeElapsed = Date.now() - downTimeStart;

      }
      downTimeStart = 0;

      yield { status: response.status, statusText: response.statusText, downTimeElapsed, downTimeTimes };

    } catch (error) {
      downTimeStart || downTimeTimes++;
      downTimeStart = downTimeStart || Date.now();
      downTimeElapsed = Date.now() - downTimeStart;
      yield { status: 0, statusText: error.message, downTimeTimes, downTimeElapsed };

    } finally {
      if (options.sleep) {
        await new Promise((resolve) => setTimeout(resolve, options.sleep));
      }
    }
  }

}
