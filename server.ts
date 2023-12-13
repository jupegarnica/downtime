async function spinServer(port = 8080) {
    return Deno.serve({
        port,
        onListen({ hostname, port }) {
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


if (import.meta.main) {
    const port = Number(Deno.args[0]) || 8080;
    await spinServer(port);
}