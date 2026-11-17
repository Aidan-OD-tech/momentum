import { redirect } from "next/navigation";

// M1 only: the home screen is built in M2, so for now "/" opens the working step from the handoff's Core 01.
export default function Home() {
  redirect("/step/3");
}
