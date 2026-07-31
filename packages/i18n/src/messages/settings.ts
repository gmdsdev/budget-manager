import type { MessageTable } from "./table";

export const settings = {
  "settings.title": { en: "User Settings", "pt-BR": "Configurações da conta" },
  "settings.description": {
    en: "Your account details and the defaults the rest of the app reads.",
    "pt-BR": "Os dados da sua conta e os padrões que o resto do app usa.",
  },
  "settings.loading": {
    en: "Loading settings",
    "pt-BR": "Carregando configurações",
  },

  "settings.profile.title": { en: "Profile", "pt-BR": "Perfil" },
  "settings.profile.description": {
    en: "How your account is identified across the app.",
    "pt-BR": "Como sua conta é identificada no app.",
  },
  "settings.profile.emailHint": {
    en: "Your sign-in email cannot be changed here.",
    "pt-BR": "O e-mail de acesso não pode ser alterado aqui.",
  },
  "settings.profile.submit": { en: "Save profile", "pt-BR": "Salvar perfil" },
  "settings.profile.updated": {
    en: "Profile updated successfully",
    "pt-BR": "Perfil atualizado com sucesso",
  },

  "settings.password.title": { en: "Password", "pt-BR": "Senha" },
  "settings.password.description": {
    en: "Changing your password signs you out everywhere else.",
    "pt-BR": "Alterar a senha encerra sua sessão em todos os outros lugares.",
  },
  "settings.password.current": {
    en: "Current password",
    "pt-BR": "Senha atual",
  },
  "settings.password.new": { en: "New password", "pt-BR": "Nova senha" },
  "settings.password.confirm": {
    en: "Confirm new password",
    "pt-BR": "Confirme a nova senha",
  },
  "settings.password.submit": {
    en: "Change password",
    "pt-BR": "Alterar senha",
  },
  "settings.password.submitting": { en: "Changing…", "pt-BR": "Alterando…" },
  "settings.password.updated": {
    en: "Password changed successfully",
    "pt-BR": "Senha alterada com sucesso",
  },

  "settings.appearance.title": { en: "Appearance", "pt-BR": "Aparência" },
  "settings.appearance.description": {
    en: "Pick the colour scheme the app renders in.",
    "pt-BR": "Escolha o esquema de cores em que o app é exibido.",
  },
  "settings.appearance.scheme": {
    en: "Colour scheme",
    "pt-BR": "Esquema de cores",
  },
  "settings.appearance.hint": {
    en: "Applied immediately and remembered on this device.",
    "pt-BR": "Aplicado imediatamente e lembrado neste dispositivo.",
  },

  "settings.language.title": { en: "Language", "pt-BR": "Idioma" },
  "settings.language.description": {
    en: "The language the app is written in.",
    "pt-BR": "O idioma em que o app é exibido.",
  },
  "settings.language.label": { en: "Language", "pt-BR": "Idioma" },
  "settings.language.hint": {
    en: "Applied immediately and saved to your account, so every device you sign in on reads the same language.",
    "pt-BR":
      "Aplicado imediatamente e salvo na sua conta, então todo dispositivo em que você entrar usa o mesmo idioma.",
  },
  "settings.language.submit": { en: "Save language", "pt-BR": "Salvar idioma" },
  "settings.language.updated": {
    en: "Language updated successfully",
    "pt-BR": "Idioma atualizado com sucesso",
  },

  "settings.defaults.title": { en: "Defaults", "pt-BR": "Padrões" },
  "settings.defaults.description": {
    en: "What a new account starts as, and which currency the dashboard opens on.",
    "pt-BR":
      "Com o que uma nova conta começa, e em qual moeda o painel abre.",
  },
  "settings.defaults.currency": {
    en: "Default currency",
    "pt-BR": "Moeda padrão",
  },
  "settings.defaults.currencyHint": {
    en: "Preselected when you create a wallet or a credit card, and the currency the dashboard scopes to when you have more than one.",
    "pt-BR":
      "Pré-selecionada ao criar uma carteira ou cartão de crédito, e a moeda que o painel usa quando você tem mais de uma.",
  },
  "settings.defaults.submit": {
    en: "Save defaults",
    "pt-BR": "Salvar padrões",
  },
  "settings.defaults.updated": {
    en: "Preferences updated successfully",
    "pt-BR": "Preferências atualizadas com sucesso",
  },
} as const satisfies MessageTable;
