export interface Config {
  noAmplify: string | undefined;
}
export const config: Config = {
  noAmplify: import.meta.env.VITE_NO_AMPLIFY,
};
