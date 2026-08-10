import type { MessageTable } from "./table";

export const onboarding = {
  "onboarding.title": { en: "Welcome to Kivo", "pt-BR": "Boas-vindas ao Kivo" },
  "onboarding.subtitle": {
    en: "A few steps and your account is ready to use.",
    "pt-BR": "Alguns passos e sua conta está pronta para usar.",
  },
  "onboarding.step": {
    en: "Step {step} of {total}",
    "pt-BR": "Passo {step} de {total}",
  },
  "onboarding.back": { en: "Back", "pt-BR": "Voltar" },
  "onboarding.continue": { en: "Continue", "pt-BR": "Continuar" },
  "onboarding.skip": {
    en: "Skip for now",
    "pt-BR": "Pular por enquanto",
  },
  "onboarding.skipHint": {
    en: "Everything from here on can also be set up later, from the app itself.",
    "pt-BR":
      "Tudo daqui em diante também pode ser configurado depois, no próprio app.",
  },
  "onboarding.finish": { en: "Finish setup", "pt-BR": "Concluir configuração" },
  "onboarding.finishing": { en: "Finishing…", "pt-BR": "Concluindo…" },
  "onboarding.completed": {
    en: "You're all set",
    "pt-BR": "Tudo pronto",
  },

  "onboarding.preferences.title": {
    en: "Language & currency",
    "pt-BR": "Idioma e moeda",
  },
  "onboarding.preferences.description": {
    en: "The language the app is written in, and the currency it suggests. Saving this creates your starter categories in the language you pick.",
    "pt-BR":
      "O idioma em que o app é exibido, e a moeda que ele sugere. Salvar cria suas categorias iniciais no idioma escolhido.",
  },
  "onboarding.preferences.language": { en: "Language", "pt-BR": "Idioma" },
  "onboarding.preferences.currency": {
    en: "Default currency",
    "pt-BR": "Moeda padrão",
  },
  "onboarding.preferences.currencyHint": {
    en: "Preselected when you create a wallet or a card. You can change both later in Settings.",
    "pt-BR":
      "Pré-selecionada ao criar uma carteira ou cartão. Você pode mudar os dois depois em Configurações.",
  },
  "onboarding.preferences.submit": {
    en: "Save and continue",
    "pt-BR": "Salvar e continuar",
  },
  "onboarding.preferences.saved": {
    en: "Preferences saved and categories created",
    "pt-BR": "Preferências salvas e categorias criadas",
  },

  "onboarding.wallets.title": {
    en: "Add your first wallet",
    "pt-BR": "Adicione sua primeira carteira",
  },
  "onboarding.wallets.description": {
    en: "A wallet is anywhere you keep money — a bank account, cash, savings. Transactions always live in one.",
    "pt-BR":
      "Uma carteira é qualquer lugar onde você guarda dinheiro — conta bancária, dinheiro vivo, poupança. Toda transação vive em uma.",
  },
  "onboarding.wallets.empty": {
    en: "No wallets yet.",
    "pt-BR": "Nenhuma carteira ainda.",
  },

  "onboarding.cards.title": {
    en: "Add your credit cards",
    "pt-BR": "Adicione seus cartões de crédito",
  },
  "onboarding.cards.description": {
    en: "Card purchases land on statements, and paying a bill settles them. No cards? Just continue.",
    "pt-BR":
      "Compras no cartão caem em faturas, e pagar uma fatura as quita. Não tem cartão? É só continuar.",
  },
  "onboarding.cards.empty": {
    en: "No credit cards yet.",
    "pt-BR": "Nenhum cartão de crédito ainda.",
  },

  "onboarding.categories.title": {
    en: "Make the categories yours",
    "pt-BR": "Deixe as categorias com a sua cara",
  },
  "onboarding.categories.description": {
    en: "We created a starter set in your language. Rename or recolour any of them, add your own — or keep them as they are.",
    "pt-BR":
      "Criamos um conjunto inicial no seu idioma. Renomeie ou mude a cor de qualquer uma, crie as suas — ou deixe como estão.",
  },
  "onboarding.categories.empty": {
    en: "No categories yet — save the first step to create them.",
    "pt-BR": "Nenhuma categoria ainda — salve o primeiro passo para criá-las.",
  },
  "onboarding.categories.edit": {
    en: "Edit {name}",
    "pt-BR": "Editar {name}",
  },
} as const satisfies MessageTable;
