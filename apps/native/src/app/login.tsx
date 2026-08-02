import { useState } from "react";

import { SignInForm } from "@/modules/auth/components/sign-in-form";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";

export default function LoginRoute() {
  const [showSignIn, setShowSignIn] = useState(true);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
