import type { MessageTable } from "./table";

export const subscription = {
  "subscription.error.required": {
    en: "Your subscription has ended. Start one to keep using Kivo.",
    "pt-BR": "Sua assinatura terminou. Assine para continuar usando o Kivo.",
  },

  "subscription.title": { en: "Subscription", "pt-BR": "Assinatura" },
  "subscription.description": {
    en: "Kivo is a subscription app, with a {days}-day free trial on every new account.",
    "pt-BR":
      "O Kivo é um app por assinatura, com {days} dias grátis em toda conta nova.",
  },

  "subscription.state.trialing": { en: "Free trial", "pt-BR": "Teste grátis" },
  "subscription.state.active": { en: "Active", "pt-BR": "Ativa" },
  "subscription.state.past_due": { en: "Payment failed", "pt-BR": "Pagamento falhou" },
  "subscription.state.expired": { en: "Expired", "pt-BR": "Expirada" },

  "subscription.paywall.title": {
    en: "Your free trial has ended",
    "pt-BR": "Seu teste grátis terminou",
  },
  "subscription.paywall.description": {
    en: "Subscribe to get your wallets, cards, budgets and history back. Nothing was deleted.",
    "pt-BR":
      "Assine para recuperar suas carteiras, cartões, orçamentos e histórico. Nada foi excluído.",
  },
  "subscription.paywall.activeTitle": {
    en: "You're all set",
    "pt-BR": "Está tudo certo",
  },
  "subscription.paywall.activeDescription": {
    en: "Your subscription is active. Manage payment details or cancel any time.",
    "pt-BR":
      "Sua assinatura está ativa. Gerencie o pagamento ou cancele quando quiser.",
  },
  "subscription.paywall.trialTitle": {
    en: "You're on the free trial",
    "pt-BR": "Você está no teste grátis",
  },
  "subscription.paywall.pastDueTitle": {
    en: "We couldn't take your payment",
    "pt-BR": "Não conseguimos processar seu pagamento",
  },
  "subscription.paywall.pastDueDescription": {
    en: "Update your payment details to keep your account open.",
    "pt-BR": "Atualize seus dados de pagamento para manter a conta aberta.",
  },

  "subscription.trial.daysLeft": {
    en: "{days} days left in your trial",
    "pt-BR": "Faltam {days} dias do seu teste",
  },
  "subscription.trial.lastDay": {
    en: "Last day of your trial",
    "pt-BR": "Último dia do seu teste",
  },
  "subscription.trial.endsOn": {
    en: "Trial ends on {date}",
    "pt-BR": "O teste termina em {date}",
  },
  "subscription.renewsOn": { en: "Renews on {date}", "pt-BR": "Renova em {date}" },
  "subscription.endsOn": { en: "Ends on {date}", "pt-BR": "Termina em {date}" },

  "subscription.action.subscribe": { en: "Subscribe", "pt-BR": "Assinar" },
  "subscription.action.manage": {
    en: "Manage subscription",
    "pt-BR": "Gerenciar assinatura",
  },
  "subscription.action.updatePayment": {
    en: "Update payment details",
    "pt-BR": "Atualizar pagamento",
  },
  "subscription.action.refresh": { en: "Refresh status", "pt-BR": "Atualizar status" },
  "subscription.action.backToApp": { en: "Back to Kivo", "pt-BR": "Voltar ao Kivo" },

  "subscription.unavailable": {
    en: "Billing isn't set up on this deployment yet, so there's nothing to subscribe to.",
    "pt-BR":
      "A cobrança ainda não está configurada nesta instalação, então não há o que assinar.",
  },
  "subscription.checkoutFailed": {
    en: "We couldn't open checkout. Please try again.",
    "pt-BR": "Não conseguimos abrir o checkout. Tente novamente.",
  },
  "subscription.portalFailed": {
    en: "We couldn't open the billing portal. Please try again.",
    "pt-BR": "Não conseguimos abrir o portal de cobrança. Tente novamente.",
  },
  "subscription.loading": {
    en: "Loading your subscription",
    "pt-BR": "Carregando sua assinatura",
  },
} as const satisfies MessageTable;
