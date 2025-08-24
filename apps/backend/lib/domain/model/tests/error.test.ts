import { NotImplementedError } from "../error";

test("NotImplementedError", () => {
  const f = () => {
    throw new NotImplementedError();
  };
  // f();
  expect(() => f()).toThrowError("NotImplementedError");
});
