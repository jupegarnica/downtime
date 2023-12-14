import React from 'npm:react';
import { render, Text, Box } from 'npm:ink';
import { ms as milliseconds } from "https://deno.land/x/ms@v0.1.0/ms.ts";
import { checkDownTime } from "./main.ts";
import Link from 'npm:ink-link';
import BigText from 'npm:ink-big-text';
import Gradient from 'npm:ink-gradient';
const { useState, useEffect } = React;
const startTime = Date.now();
function App({ urls, timeout, sleep }: { urls: string[], timeout: number, sleep: number }) {
    useEffect(() => {
        const INTERVAL = totalTime < 60_000 ? 1000 : 60_000;
        const interval = setInterval(() => {
            setTotalTime(Date.now() - startTime);
        }, INTERVAL);
        return () => clearInterval(interval);
    }, []);

    const [totalTime, setTotalTime] = useState(0);


    const infoColor = "grey";
    const flexDirection = "column";

    return (
        <Box gap={1} flexDirection="column">
            <Gradient name="passion">

                <BigText text="Downtime" font="simple" space={false} letterSpacing={0} />
            </Gradient>
            <Box flexDirection="row" gap={1} paddingTop={1}>
                <Text color={infoColor} dimColor>From:</Text><Text color={infoColor}>{new Date(startTime).toLocaleString()}</Text>
                <Text color={infoColor} dimColor>Total:</Text><Text color={infoColor}>{ms(totalTime, { long: true })}</Text>
                <Text color={infoColor} dimColor>--sleep</Text><Text color={infoColor}>{ms(sleep)}</Text>
                <Text color={infoColor} dimColor>--timeout</Text><Text color={infoColor}>{ms(timeout)}</Text>
            </Box>
            <Box gap={0} flexDirection={flexDirection} wrap >
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

        <Box flexDirection="column" >
            <Box flexDirection="row" gap={1} justifyContent="space-between">
                <Box gap={1}>
                    {
                        status ?
                            <Text bold color={statusColor(status)}>► {status}</Text> :
                            <Text color="red">🛑   </Text>
                    }
                    <Link url={url} >
                        <Text color="cyan">{url}</Text>
                    </Link>
                </Box>
                <Box flex-grow={1} />
                <Box>
                    <Box gap={1}>
                        <Text color='whiteBright' inverse> {ms(downTimeElapsed)} </Text>
                        <Text color="gray" dimColor>{"downtime"}</Text>
                        <Text color='white'>{ms(upTimeElapsed)}</Text>
                        <Text color="gray" dimColor>{"uptime  "}</Text>
                    </Box>
                </Box>
            </Box>
            {
                errorMessages
                    ? <Box paddingTop={1} paddingLeft={3} paddingBottom={1}><Text color="red"
                        dimColor>{errorMessages}</Text></Box>
                    : null
            }

        </Box>
    );

}

function statusColor(status: number) {
    if (status >= 200 && status < 300) return "#00ff00";
    if (status >= 300 && status < 400) return "#ffff00";
    if (status >= 400 && status < 500) return "#ff7f00";
    return "#ff0000";
}
function ms(ms: number, options?: { long: boolean }) {
    const output = milliseconds(ms, options);
    return String(output).match(/^0/) ? '0' : output;
}



export function renderUI(urls: string[], sleep: number, timeout: number) {
    return render(<App urls={urls} timeout={timeout} sleep={sleep} />);
}
