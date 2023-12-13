import { renderUI } from "./ui.tsx";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

const args = parseArgs(Deno.args);
const urls = args._.map(String);
const sleep = args.sleep ? Number(args.sleep) : 1000;
const timeout = args.sleep ? Number(args.timeout) : 5000;
const maxTime = args.maxTime ? Number(args.maxTime) : 0


if (import.meta.main) {
    const { unmount } = renderUI(urls, sleep, timeout);

    Deno.addSignalListener("SIGINT", () => {
        unmount();
    });

    if (maxTime) {
        setTimeout(() => {
            unmount();
        }, maxTime);
    }
}