import type { MessageTable } from "./table";

export const auth = {
  "auth.welcomeBack": { en: "Welcome Back", "pt-BR": "Bem-vindo de volta" },
  "auth.createAccount": { en: "Create Account", "pt-BR": "Criar conta" },
  "auth.email": { en: "Email", "pt-BR": "E-mail" },
  "auth.password": { en: "Password", "pt-BR": "Senha" },
  "auth.name": { en: "Name", "pt-BR": "Nome" },
  "auth.signIn": { en: "Sign In", "pt-BR": "Entrar" },
  "auth.signUp": { en: "Sign Up", "pt-BR": "Cadastrar" },
  "auth.submitting": { en: "Submitting...", "pt-BR": "Enviando..." },
  "auth.needAnAccount": {
    en: "Need an account? Sign Up",
    "pt-BR": "Não tem uma conta? Cadastre-se",
  },
  "auth.alreadyHaveAnAccount": {
    en: "Already have an account? Sign In",
    "pt-BR": "Já tem uma conta? Entre",
  },
  "auth.signInSuccessful": {
    en: "Sign in successful",
    "pt-BR": "Login efetuado",
  },
  "auth.signUpSuccessful": {
    en: "Sign up successful",
    "pt-BR": "Cadastro efetuado",
  },
  "auth.sessionExpired": { en: "Session expired", "pt-BR": "Sessão expirada" },
  "auth.signInAgainToManageSettings": {
    en: "Sign in again to manage your settings.",
    "pt-BR": "Entre novamente para gerenciar suas configurações.",
  },
} as const satisfies MessageTable;
