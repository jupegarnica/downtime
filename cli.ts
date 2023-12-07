import { checkDownTime } from "./main.ts";
import { wait } from "https://deno.land/x/wait/mod.ts";
import { ms } from "https://deno.land/x/ms@v0.1.0/ms.ts";

const controller = new AbortController();

const args = Deno.args;
const url = args[0];
const timeout = parseInt(args[1]) || 1000;
const sleep = parseInt(args[2]) || 200;

if (!url) {
    console.log('url is required');
    Deno.exit(1);
}

let downTimeElapsed = 0;
// handle ctrl-c




if (import.meta.main) {
    const _url = new URL(url);

    const spinner = wait('monitoring ' + _url + '...').start();

    Deno.addSignalListener("SIGINT", () => {
        spinner.succeed(`${_url} =>  downtime: ${ms(downTimeElapsed)}`);
        controller.abort();
        Deno.exit(0);
      });



    const generator = checkDownTime(_url.toString(), { timeout, sleep, signal: controller.signal });


    for await (const data of generator) {

        downTimeElapsed = data.downTimeElapsed;
        spinner.text = `${_url} =>  downtime: ${ms(downTimeElapsed)}`;
    }
    spinner.succeed();
}