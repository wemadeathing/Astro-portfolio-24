/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL?: string;
  readonly CONTACT_EMAIL?: string;
  readonly WEB3FORMS_ACCESS_KEY: string;
  readonly MAILERLITE_API_TOKEN?: string;
  readonly MAILERLITE_GROUP_ID?: string;
  readonly MAILERLITE_API_BASE_URL?: string;
  readonly OPENAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': any;
    [elemName: string]: any;
  }
}

declare module '*.astro' {
  const Component: any;
  export default Component;
}