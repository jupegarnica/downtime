import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { checkDownTime } from "./main.ts";

async function spinServer(signal: AbortSignal) {

  return await Deno.serve({
    port: 8080,
    signal,


  }, () => new Response('Hello World'));
}


Deno.test('checkDownTime', async () => {
  const controller = new AbortController();

  const generator = checkDownTime('http://localhost:8080', { timeout: 10, sleep: 500, signal: controller.signal });

  const serverController = new AbortController();
  spinServer(serverController.signal);

  setTimeout(() => serverController.abort(), 1000);

  setTimeout(() => spinServer(serverController.signal), 2000);

  setTimeout(() => controller.abort(), 3000);


  for await (const data of generator) {
    console.log(data);
    const timeElapsedMs = data.totalDownTimeElapsed;
    const timeElapsedSec = timeElapsedMs / 1000;
    const timeElapsedMin = timeElapsedSec / 60;

    console.log(`${timeElapsedSec} sec`);

  }
});
