import React from 'npm:react';
import { render, Text, Box } from 'npm:ink';
import { ms as milliseconds } from "https://deno.land/x/ms@v0.1.0/ms.ts";
import { checkDownTime } from "./main.ts";
import Link from 'npm:ink-link';
import BigText from 'npm:ink-big-text';
import Gradient from 'npm:ink-gradient';

import * as Marked from 'npm:marked@4.2.12';
import * as Renderer from 'npm:marked-terminal@5.1.1';
import chalk from 'npm:chalk@5.2.0';


const { useState, useEffect } = React;
const startTime = Date.now();
function App({ urls, timeout, sleep, maxTime }: { urls: string[], timeout: number, sleep: number, maxTime: number }) {
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
            <Title >Downtime</Title>
            <Box flexDirection="row" gap={1} paddingTop={1}>
                <Text color={infoColor} dimColor>From:</Text><Text color={infoColor}>{new Date(startTime).toLocaleString()}</Text>
                <Text color={infoColor} dimColor>Total:</Text><Text color={infoColor}>{ms(totalTime, { long: true })}</Text>
                <Text color={infoColor} dimColor>--sleep</Text><Text color={infoColor}>{ms(sleep)}</Text>
                <Text color={infoColor} dimColor>--timeout</Text><Text color={infoColor}>{ms(timeout)}</Text>
                <Text color={infoColor} dimColor>--maxTime</Text><Text color={infoColor}>{ms(maxTime || Infinity)}</Text>
                <Text dimColor>ctrl + c to close</Text>
            </Box>

            <Box gap={0} flexDirection={flexDirection} wrap >
                {urls.map((url) => (
                    <UrlMonitor key={url} url={url} timeout={timeout} sleep={sleep} />
                ))}
            </Box>
        </Box>
    )

}

function Title({ children }: { children?: string }) {
    return (
        <Box>
            <Gradient name="passion">
                <BigText text={children} font="simple" space={false} letterSpacing={0} />
            </Gradient>
        </Box>
    );
}

function UrlMonitor({ url, timeout, sleep }: { url: string, key?: string, timeout: number, sleep: number }) {

    try {
        new URL(url);
    } catch (error) {
        return (
            <Box padding={1}>
                <Text color="red">{error.message}</Text>
            </Box>
        )
    }
    const [downTimeElapsed, setDownTimeElapsed] = useState(0);
    const [upTimeElapsed, setUpTimeElapsed] = useState(0);
    const [status, setStatus] = useState('   ');
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
                    <Link url={url} fallback={false}>
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
    let outputZero = String(output).match(/^0/) ? '0' : output;
    let outputInfinity = String(output).match(/^Infinity/) ? '∞' : outputZero;
    return outputInfinity
}

function Markdown({ children }: { children: string }) {

    const marked = Marked.marked;
    const TerminalRenderer = Renderer.default;

    const defaultOptions = {
        // Colors
        code: chalk.magenta,
        codespan: chalk.magentaBright,
        blockquote: chalk.dim.italic,
        html: chalk.gray,
        heading: chalk.green.bold,
        firstHeading: chalk.magenta.underline.bold,
        hr: chalk.reset,
        listitem: chalk.reset,
        table: chalk.reset,
        paragraph: chalk.reset,
        strong: chalk.bold,
        em: chalk.italic,
        del: chalk.dim.gray.strikethrough,
        link: chalk.blue,
        href: chalk.blue.underline,

        // Formats the bullet points and numbers for lists
        // list: function (_body, _ordered) {},

        // Reflow and print-out width
        width: 80, // only applicable when reflow is true
        reflowText: false,

        // Should it prefix headers?
        showSectionPrefix: true,

        // Whether or not to undo marked escaping
        // of entities (" -> &quot; etc)
        unescape: true,

        // Whether or not to show emojis
        emoji: true,

        // Options passed to cli-table3
        tableOptions: {},

        // The size of tabs in number of spaces or as tab characters
        tab: 3 // examples: 4, 2, \t, \t\t

        // image: function (_href, _title, _text) {} // function for overriding the default image handling.
    };
    marked.setOptions({
        renderer: new TerminalRenderer(defaultOptions)
    });
    return (
        <Text>
            {marked(children)}
        </Text>
    );

}



export function renderUI(urls: string[], sleep: number, timeout: number, maxTime: number) {
    return render(<App urls={urls} timeout={timeout} sleep={sleep} maxTime={maxTime} />);
}

export function renderMarkdown(markdown: string) {
    return render(<Markdown children={markdown}></Markdown>);
}
