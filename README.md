# Downtime

A CLI tool to check the downtime of multiples websites in realtime


## Install

To install the CLI tool, you need to have [Deno](https://deno.land/) installed in your machine.

Then, you can run the following command:
```sh
deno install --allow-read --allow-net -fn downtime https://deno.land/x/downtime/cli.ts
```

## Usage

```sh
downtime https://garn.dev http://faker.deno.dev --sleep 2000 --timeout 3000

```