export interface GreetProps {
  from: string;
  to: string;
}
export const greet = (props: GreetProps): string => {
  return `Hello ${props.to} ! by ${props.from}`;
};
