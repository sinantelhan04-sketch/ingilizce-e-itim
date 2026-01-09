// Manual definition for process.env since vite/client is missing
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};
