import React from 'npm:react';
import { render, Text } from 'npm:ink';
import { ms } from "https://deno.land/x/ms@v0.1.0/ms.ts";
import { checkDownTime } from "./main.ts";

const { useState, useEffect } = React;

function App({urls}: {urls: string[]}) {


    return urls.map((url) => <UrlMonitor key={url} url={url} />);

}

function UrlMonitor({url}: {url: string, key?: string}) {

    try {
        new URL(url);
    } catch (error) {
        return <Text color="red">Invalid URL: {url}</Text>;
    }
    const [downTimeElapsed, setDownTimeElapsed] = useState(0);
    const [status, setStatus] = useState(0);
    const [errorMessages, setErrorMessages] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const generator = checkDownTime(url, { signal });

        (async () => {
            for await (const data of generator) {
                setDownTimeElapsed(data.downTimeElapsed);
                setStatus(data.status);
                setErrorMessages(data.statusText);
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
            {"=>"} status: {status} {'\n'}
            {!status && `=>  error: ${errorMessages}`}
        </Text>
    );

}



export function renderUI(...urls: string[]) {
    return render(<App urls={urls}/>);
}

// const _url = new URL(url);

//     const spinner = wait('monitoring ' + _url + '...').start();

//


//     const generator = checkDownTime(_url.toString(), { timeout, sleep, signal: controller.signal });


//     for await (const data of generator) {

//         downTimeElapsed = data.downTimeElapsed;
//         const errorMessages = data.status ? '' : data.statusText;
//         spinner.text = `${_url} \n=>  downtime: ${ms(downTimeElapsed)}\n=>  status: ${data.status} ${errorMessages && `\n=>  error: ${errorMessages}`}`;
//     }
//     spinner.succeed(`${_url} \n=>  downtime: ${ms(downTimeElapsed)}`);