import React from 'npm:react';
import { render, Text } from 'npm:ink';
import { ms } from "https://deno.land/x/ms@v0.1.0/ms.ts";
import { checkDownTime } from "./main.ts";

const { useState, useEffect } = React;

function App({ urls, timeout, sleep }: { urls: string[], timeout: number, sleep: number }) {


    return urls.map((url) => <UrlMonitor key={url} url={url} timeout={timeout} sleep={sleep} />);

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

        const generator = checkDownTime(url, { signal });

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
        <Text>
            {url} {'\n'}
            {"=>"} downtime: {ms(downTimeElapsed)} {'\n'}
            {"=>"} uptime: {ms(upTimeElapsed)} {'\n'}
            {status && `=>  status: ${status}`}
            {!status && `=>  error: ${errorMessages}`}
        </Text>
    );

}



export function renderUI(urls: string[], timeout: number, sleep: number) {
    return render(<App urls={urls} timeout={timeout} sleep={sleep} />);
}
