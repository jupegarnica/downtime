import React from 'npm:react';
import { render, Text, Box } from 'npm:ink';
import { ms } from "https://deno.land/x/ms@v0.1.0/ms.ts";
import { checkDownTime } from "./main.ts";

const { useState, useEffect } = React;
const startTime = Date.now();
function App({ urls, timeout, sleep }: { urls: string[], timeout: number, sleep: number }) {

    const infoColor = "grey";
    const [totalTime, setTotalTime] = useState(0);
    useEffect(() => {
        const INTERVAL = totalTime < 60_000 ? 1000 : 60_000;
        const interval = setInterval(() => {
            setTotalTime(Date.now() - startTime);
        }, INTERVAL);
        return () => clearInterval(interval);
    }, []);
    return (
        <Box gap={1} flexDirection="column">
            <Box flexDirection="row" gap={1} paddingTop={1}>
                <Text color={infoColor} dimColor>From:</Text><Text color={infoColor}>{new Date(startTime).toLocaleString()}</Text>
                <Text color={infoColor} dimColor>Total:</Text><Text color={infoColor}>{ms(totalTime)}</Text>
                <Text color={infoColor} dimColor>--sleep</Text><Text color={infoColor}>{ms(sleep)}</Text>
                <Text color={infoColor} dimColor>--timeout</Text><Text color={infoColor}>{ms(timeout)}</Text>
            </Box>
            <Box gap={1} flexDirection="column" >
                {urls.map((url) => (
                    <UrlMonitor key={url} url={url} timeout={timeout} sleep={sleep} />
                ))}
            </Box>
        </Box>
    )

}

function UrlMonitor({ url, timeout, sleep }: { url: string, key?: string, timeout: number, sleep: number }) {

    try {
        new URL(url);
    } catch (error) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="blackBright" padding={1}>
                <Text color="red">{error.message}</Text>
            </Box>
        )
    }
    const [downTimeElapsed, setDownTimeElapsed] = useState(0);
    const [upTimeElapsed, setUpTimeElapsed] = useState(0);
    const [status, setStatus] = useState(200);
    const [errorMessages, setErrorMessages] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const generator = checkDownTime(url, { signal, timeout, sleep });

        (async () => {
            for await (const data of generator) {
                setDownTimeElapsed(data.totalDownTimeElapsed);
                setUpTimeElapsed(data.totalUpTimeElapsed);
                setStatus(data.lastResponse?.status || 0);
                setErrorMessages(data.lastError?.message);
            }
        })();

        return () => {
            controller.abort();
        };
    }, [url]);



    return (

        <Box flexDirection="column" borderStyle="round" borderColor="blackBright" padding={1}>
            <Box flexDirection="row" gap={1}>
                <Box flexDirection="row" gap={1}>
                    {
                        status ?
                            <Text color={statusColor(status)}>►  {status}</Text> :
                            <Text color="red">🛑 ---</Text>
                    }

                </Box>
                <Text color="cyan">{url}</Text>
                <Box gap={1}>
                    <Text color='whiteBright'>{ms(downTimeElapsed)}</Text>
                    <Text color="gray">{"downtime"}</Text>
                </Box>
                <Box gap={1}>
                    <Text color='whiteBright'>{ms(upTimeElapsed)}</Text>
                    <Text color="gray">{"uptime  "}</Text>
                </Box>
            </Box>
            {
                errorMessages
                    ? <Box paddingTop={1} paddingLeft={3}><Text color="red">{errorMessages}</Text></Box>
                    : null
            }

        </Box>
    );

}

function statusColor(status: number) {
    if (status >= 200 && status < 300) return "green";
    if (status >= 300 && status < 400) return "yellow";
    if (status >= 400 && status < 500) return "red";
    return "red";
}



export function renderUI(urls: string[], sleep: number, timeout: number) {
    return render(<App urls={urls} timeout={timeout} sleep={sleep} />);
}
