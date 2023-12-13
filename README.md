# Downtime

A CLI tool to check the downtime of multiples websites in realtime

## Prerequisites

To install the CLI tool, you need to have [Deno](https://deno.land/) installed in your machine.

## Usage


## Install and run

install the CLI tool globally.
```sh
deno install --allow-read --allow-net -fn downtime https://deno.land/x/downtime/cli.ts
```
run:
```sh
downtime https://garn.dev http://faker.deno.dev --sleep 2000 --timeout 3000

```
### Run remotely

```sh
deno run -A https://deno.land/x/downtime/cli.ts https://garn.dev
```

## Options

```sh
--sleep 1000 # sleep ms between each request (default: 1000)
--timeout 5000 # timeout ms for each request (default: 5000)
```
