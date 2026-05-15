![Banner](/assets/altair_banner_small.png)

## Introduction
Altair is both a userscript and a custom client for ZOMBS.io that aims to revolutionize how scripts and custom clients are made in the future. On the technical side, it features many toolings that trivializes the development process and makes developing for ZOMBS.io much more enjoyable.

## Development

### Prerequisites
- Node.js (v10.16.0+)
- pnpm

### Installation
1. Clone the repository and run `pnpm install` to install the dependencies.
2. Build the project for the first time by running `pnpm run build`.

#### Userscript Development
1. Copy the dev script template ([here](/dev/dev.user.js)) and replace `@require` to the actual path.
2. There is a HMR server that you can use to quickly reflect changes in Tampermonkey. Run `pnpm run script:dev` to start it.
3. Done! Now you can start developing the script with instant reload.

#### Client Development
1. Run `pnpm run client:dev` to start a dev server.
2. Open [http://localhost:727](http://localhost:727) in your browser.
3. Done! Now you can start developing the client with live reload.
