import { renderMarkdown, renderUI } from "./ui.tsx";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

const args = parseArgs(Deno.args);
const help = args.help;
const urls = args._.map(String);
const sleep = args.sleep ? Number(args.sleep) : 1000;
const timeout = args.timeout ? Number(args.timeout) : 5000;
const maxTime = args.maxTime ? Number(args.maxTime) * 1_000 : 0


if (import.meta.main) {
    if (help) {
        renderMarkdown(await Deno.readTextFile(new URL(import.meta.resolve('./README.md'))));
        Deno.exit(0)
    }
    if (urls.length === 0) {

        renderMarkdown(
            `> URLs not provided
`
        )
        Deno.exit(1);
    }




    const { unmount } = renderUI(urls, sleep, timeout, maxTime);

    Deno.addSignalListener("SIGINT", () => {
        unmount();
    });

    if (maxTime) {
        setTimeout(() => {
            unmount();
        }, maxTime);
    }
}