export class NotImplementedError implements Error {
  name: string;
  message: string;
  constructor(message: string = "NotImplementedError") {
    this.name = "NotImplementedError";
    this.message = message;
  }
}
