import { assertEquals, assertStringIncludes, assertAlmostEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { checkDownTime } from "./main.ts";

async function spinServer(signal: AbortSignal, port = 8080) {
  return Deno.serve({
    port: 8080,
    signal: signal,
    onListen({hostname, port}) {
      console.log(`${hostname}:${port} started`);
    },
    onError(error) {
      console.error(error);
      return new Response('error: ' + String(error));

    }
  }, () => {
    console.log('-> request');
    return new Response('ok');
  });
}

function assertTimeIsAlmostEqual(actual: number, expected: number, errorMargin: number = 5) {
  assertAlmostEquals(actual, expected, errorMargin)
}

Deno.test('checkDownTime', async () => {
  const FETCH_TIMEOUT = 2;
  const FETCH_SLEEP = 1;
  const generatorController = new AbortController();
  const generator = checkDownTime('http://localhost:8080', { timeout: FETCH_TIMEOUT, sleep: FETCH_SLEEP, signal: generatorController.signal });

  const server1Controller = new AbortController();
  const server1 = await spinServer(server1Controller.signal);
  server1Controller.signal.addEventListener('abort', () => console.log('server1 aborted'));

  const uptimeStart = Date.now();
  let totalUpTimeElapsed: number;
  let totalDownTimeElapsed: number;

  {
    // first run should be a success
    const { value: data } = await generator.next();
    assertEquals(data.requestsCount, 1);
    assertEquals(data.responses.length, 1);
    assertEquals(data.errors.length, 0);
    assertEquals(data.lastResponse?.status, 200);
    assertEquals(data.lastError, null);
    assertEquals(data.totalUpTimeElapsed, 0);
    assertEquals(data.totalDownTimeElapsed, 0);
    assertEquals(data.downTimeTimes, 0);
  }

  {
    // second run should be a success and uptime should be elapsed
    const uptimeElapsed = Date.now() - uptimeStart; // 5ms for the generator to run
    const { value: data } = await generator.next();
    assertEquals(data.requestsCount, 2);
    assertEquals(data.responses.length, 2);
    assertEquals(data.errors.length, 0);
    assertEquals(data.totalDownTimeElapsed, 0);
    assertEquals(data.responses.length, 2);
    assertEquals(data.errors.length, 0);
    assertTimeIsAlmostEqual(data.totalUpTimeElapsed, uptimeElapsed);
    totalUpTimeElapsed = data.totalUpTimeElapsed;
  }

  // third run should be a failure but not down time
  server1Controller.abort();
  await server1.finished;
  const downTimeStart = Date.now();
  {
    const { value: data } = await generator.next();

    assertEquals(data.requestsCount, 3);
    assertEquals(data.responses.length, 2);
    assertEquals(data.errors.length, 1);
    assertEquals(data.lastResponse, null);

    assertStringIncludes(String(data.lastError?.message), 'error sending request for url ');
    assertEquals(data.lastError?.name, 'TypeError');

    assertEquals(data.totalDownTimeElapsed, 0);
    assertEquals(data.downTimeTimes, 1);
    assertEquals(data.totalUpTimeElapsed, totalUpTimeElapsed);

  }

  {
    // fourth run should be a success and down time should be elapsed
    const downTimeElapsed = Date.now() - downTimeStart; // 5ms for the generator to run
    const { value: data } = await generator.next();
    assertEquals(data.requestsCount, 4);
    assertEquals(data.responses.length, 2);
    assertEquals(data.errors.length, 2);
    assertEquals(data.downTimeTimes, 1);

    assertTimeIsAlmostEqual(data.totalDownTimeElapsed, downTimeElapsed);
    assertEquals(data.totalUpTimeElapsed, totalUpTimeElapsed);


  }


  const server2Controller = new AbortController();
  const server2 = await spinServer(server2Controller.signal);
  server2Controller.signal.addEventListener('abort', () => console.log('server2 aborted'));

  {
    // fifth run should be a success and uptime should be elapsed
    const uptimeElapsed = Date.now() - uptimeStart;
    const downTimeElapsed = Date.now() - downTimeStart;
    const { value: data } = await generator.next();
    assertEquals(data.requestsCount, 5);
    assertEquals(data.responses.length, 3);
    assertEquals(data.errors.length, 2);
    assertTimeIsAlmostEqual(data.totalUpTimeElapsed, uptimeElapsed);
    assertTimeIsAlmostEqual(data.totalDownTimeElapsed, downTimeElapsed, 1);

    totalDownTimeElapsed = data.totalDownTimeElapsed;
  }

  {
    // sixth run should be a success and uptime should be elapsed
    const { value: data } = await generator.next();
    assertEquals(data.requestsCount, 6);
    assertEquals(data.responses.length, 4);
    assertEquals(data.errors.length, 2);
    assertEquals(data.totalDownTimeElapsed, totalDownTimeElapsed);

  }


  server2Controller.abort();
  await server2.finished;

  await new Promise((resolve) => setTimeout(resolve, FETCH_SLEEP));
  console.log('done');

  // for await (let data of generator) {

  //   console.log(
  //     String(data.lastError).padStart(40, ' ').slice(0, 40),
  //     String(data.lastResponse?.status).padStart(10, ' '),
  //     String(data.totalUpTimeElapsed).padStart(10, ' '),
  //     String(data.totalDownTimeElapsed).padStart(10, ' '),
  //     String(data.downTimeTimes).padStart(10, ' '),
  //     String(data.lastDownTimeElapsed).padStart(10, ' '));

  // }



});
