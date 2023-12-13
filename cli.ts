import { renderUI } from "./ui.tsx";


const args = Deno.args;
const url = args[0];
const sleep = parseInt(args[1]) || 1000;
const timeout = parseInt(args[2]) || 5000;
const maxTime = parseInt(args[3]) || 0


if (!url) {
    console.log('url is required');
    Deno.exit(1);
}


if (import.meta.main) {
    const { unmount } = renderUI([url], sleep, timeout);

    Deno.addSignalListener("SIGINT", () => {
        unmount();
    });

    if (maxTime) {
        setTimeout(() => {
            unmount();
        }, maxTime);
    }
}