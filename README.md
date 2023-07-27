# Overview
Typescript Node Project for Speech to Text transcription, with sample audio files.

# Running
For the usage of the APIs there is a need of token possession for both cases. The process to obtain them is explained in the sections below.

To run:
```
npm install
npm start
```
or

```
yarn install
yarn start
```

## AssemblyAi 

A [developer account](https://www.assemblyai.com/dashboard/signup) is necessary for its usage. 

For the account to be fully functional, there is the need to do a POST to the transcription endpoints.
This can be made by executing the example on this repository.

By adding a `.env` according to `env.example`, one must copy and paste the provided api key on `ASSEMBLY`. 

The project is ready to execute with **transcriptor** variable set to `this.assembly` on `src/index.ts`

## Google

On this case, one should have a google cloud platform account, with [Speech to Text API](https://cloud.google.com/speech-to-text/docs/before-you-begin) enabled.

With it, a **google.json** file will be available. It should be pasted on the project's root.

The project is ready to execute with **transcriptor** variable set to `this.google` on `src/index.ts` (watch for audio file extensions, more insight in code comments)
