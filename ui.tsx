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
        const interval = setInterval(() => {
            setTotalTime(Date.now() - startTime);
        }, 1000);
        return () => clearInterval(interval);
    },[]);
    return (
        <Box gap={1} flexDirection="column">
            <Box flexDirection="row" gap={2}>
                <Text color={infoColor} dimColor>From:</Text><Text color={infoColor}>{new Date(startTime).toLocaleString()}</Text>
                <Text color={infoColor} dimColor>Sleep:</Text><Text color={infoColor}>{ms(sleep)}</Text>
                <Text color={infoColor} dimColor>Timeout:</Text><Text color={infoColor}>{ms(timeout)}</Text>
                <Text color={infoColor} dimColor>Total time:</Text><Text color={infoColor}>{ms(totalTime)}</Text>
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
        return <Text color="red">Invalid URL: {url}</Text>;
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
                setStatus(data.lastResponse?.status);
                setErrorMessages(data.lastError?.message);
            }
        })();

        return () => {
            controller.abort();
        };
    }, [url]);

    return (
        // <Text>
        //     {url} {'\n'}
        //     {"=>"} downtime: {ms(downTimeElapsed)} {'\n'}
        //     {"=>"} uptime: {ms(upTimeElapsed)} {'\n'}
        //     {status && `=>  status: ${status}`}
        //     {!status && `=>  error: ${errorMessages}`}
        // </Text>
        <Box flexDirection="column">
            <Text color="blue">{url}</Text>
            <Box gap={1}><Text dimColor>{"=>"} downtime:</Text><Text>{ms(downTimeElapsed)}</Text></Box>
            <Box gap={1}><Text dimColor>{"=>"} uptime:</Text><Text>{ms(upTimeElapsed)}</Text></Box>
            {status && <Text color="green">{`=>  status: ${status}`}</Text>}
            {!status && <Text color="red">{`=>  error: ${errorMessages}`}</Text>}
        </Box>
    );

}



export function renderUI(urls: string[], sleep: number, timeout: number) {
    return render(<App urls={urls} timeout={timeout} sleep={sleep} />);
}
