// import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
// import Header, { HeaderProps } from "../Header";
// import React from "react";
// import { InMemoryStateRepository } from "./utils";

// describe("ヘッダー", () => {
//   test("メニューボタンをクリックすると左ペインが開く", async () => {
//     const user = userEvent.setup();
//     const [open, setOpen] = React.useState(false);
//     const props: HeaderProps = {
//       leftMenuOpened: open,
//       setLeftMenuOpened: setOpen,
//       userAttributes: null,
//       setUserAttributes: () => {},
//       signedIn: true,
//       stateRepository: new InMemoryStateRepository(),
//       signOut: () => {},
//     };
//     render(<Header {...props} />);

//     const menuButton = screen.getByRole("button");
//     await user.click(menuButton);
//     screen.getByRole("button");
//   });
// });
