import { render, screen } from "@testing-library/react";
import { Sample } from "../sample";

test("jest動確", () => {
  render(<Sample />);
  screen.debug();
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
