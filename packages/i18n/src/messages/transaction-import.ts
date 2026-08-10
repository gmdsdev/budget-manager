import type { MessageTable } from "./table";

/**
 * The CSV import flow. The file's own tokens — column headers, the
 * income/expense values, the template's sample rows — are deliberately NOT
 * here: they are data the parser matches on, so they stay stable English
 * whatever language the screen is in, the same standing default category
 * names have.
 */
export const transactionImport = {
  "transaction.import.trigger": {
    en: "Import transactions",
    "pt-BR": "Importar transações",
  },
  "transaction.import.title": {
    en: "Import transactions",
    "pt-BR": "Importar transações",
  },
  "transaction.import.description": {
    en: "Bring in history from a CSV file, into wallets or credit cards.",
    "pt-BR":
      "Traga seu histórico de um arquivo CSV, para carteiras ou cartões de crédito.",
  },
  "transaction.import.back": {
    en: "Back to transactions",
    "pt-BR": "Voltar para transações",
  },

  "transaction.import.template.title": {
    en: "1. Download the template",
    "pt-BR": "1. Baixe o modelo",
  },
  "transaction.import.template.hint": {
    en: "Fill one row per transaction. Category and account are matched by their exact name — the account can be a wallet or a credit card, and rows on a card are always purchases. Dates use the YYYY-MM-DD format.",
    "pt-BR":
      "Preencha uma linha por transação. Categoria e conta são localizadas pelo nome exato — a conta pode ser uma carteira ou um cartão de crédito, e linhas em um cartão são sempre compras. Datas usam o formato AAAA-MM-DD.",
  },
  "transaction.import.template.download": {
    en: "Download template CSV",
    "pt-BR": "Baixar modelo CSV",
  },
  "transaction.import.template.fileName": {
    en: "kivo-transactions-template.csv",
    "pt-BR": "kivo-modelo-transacoes.csv",
  },
  "transaction.import.template.share": {
    en: "Share template CSV",
    "pt-BR": "Compartilhar modelo CSV",
  },
  "transaction.import.template.shareFailed": {
    en: "The template could not be shared",
    "pt-BR": "Não foi possível compartilhar o modelo",
  },

  "transaction.import.upload.title": {
    en: "2. Upload the filled file",
    "pt-BR": "2. Envie o arquivo preenchido",
  },
  "transaction.import.upload.choose": {
    en: "Choose CSV file",
    "pt-BR": "Escolher arquivo CSV",
  },
  "transaction.import.upload.noFile": {
    en: "No file selected",
    "pt-BR": "Nenhum arquivo selecionado",
  },
  "transaction.import.upload.submit": {
    en: "Continue to review",
    "pt-BR": "Continuar para revisão",
  },

  "transaction.import.error.emptyFile": {
    en: "The file has no transaction rows",
    "pt-BR": "O arquivo não tem linhas de transações",
  },
  "transaction.import.error.missingColumns": {
    en: "The file is missing the columns: {columns}",
    "pt-BR": "O arquivo não tem as colunas: {columns}",
  },
  "transaction.import.error.tooManyRows": {
    en: "The file has too many rows — the limit is {max}",
    "pt-BR": "O arquivo tem linhas demais — o limite é {max}",
  },
  "transaction.import.error.unreadable": {
    en: "The file could not be read as CSV",
    "pt-BR": "Não foi possível ler o arquivo como CSV",
  },

  "transaction.import.review.title": {
    en: "Review before importing",
    "pt-BR": "Revise antes de importar",
  },
  "transaction.import.review.description": {
    en: "Nothing is saved yet. Fix anything that could not be read or matched, then import.",
    "pt-BR":
      "Nada foi salvo ainda. Corrija o que não pôde ser lido ou localizado e então importe.",
  },
  "transaction.import.review.issues": {
    en: "{count} of {total} rows need attention",
    "pt-BR": "{count} de {total} linhas precisam de atenção",
  },
  "transaction.import.review.ready": {
    en: "All {total} rows are ready to import",
    "pt-BR": "Todas as {total} linhas estão prontas para importar",
  },
  "transaction.import.review.empty": {
    en: "Every row was removed. Go back and upload another file.",
    "pt-BR": "Todas as linhas foram removidas. Volte e envie outro arquivo.",
  },
  "transaction.import.review.submit": {
    en: "Import {count} transactions",
    "pt-BR": "Importar {count} transações",
  },
  "transaction.import.review.submitting": {
    en: "Importing…",
    "pt-BR": "Importando…",
  },
  "transaction.import.review.back": {
    en: "Choose another file",
    "pt-BR": "Escolher outro arquivo",
  },
  "transaction.import.review.rowNumber": {
    en: "Row {number}",
    "pt-BR": "Linha {number}",
  },
  "transaction.import.review.removeRow": {
    en: "Remove row {number}",
    "pt-BR": "Remover linha {number}",
  },
  "transaction.import.review.editRow": {
    en: "Edit row {number}",
    "pt-BR": "Editar linha {number}",
  },
  "transaction.import.review.done": {
    en: "Done",
    "pt-BR": "Pronto",
  },
  "transaction.import.review.filterAll": {
    en: "All rows ({count})",
    "pt-BR": "Todas as linhas ({count})",
  },
  "transaction.import.review.filterIssues": {
    en: "Need attention ({count})",
    "pt-BR": "Precisam de atenção ({count})",
  },
  "transaction.import.review.rowReady": {
    en: "Ready",
    "pt-BR": "Pronta",
  },
  "transaction.import.review.rowIssues": {
    en: "Fix",
    "pt-BR": "Corrigir",
  },
  "transaction.import.review.rowIssuesTitle": {
    en: "Needs attention",
    "pt-BR": "Precisa de atenção",
  },
  "transaction.import.review.removeConfirm.title": {
    en: "Remove this row?",
    "pt-BR": "Remover esta linha?",
  },
  "transaction.import.review.removeConfirm.description": {
    en: "It is dropped from this import. Nothing has been saved yet, so uploading the file again brings it back.",
    "pt-BR":
      "Ela sai desta importação. Nada foi salvo ainda, então enviar o arquivo de novo a traz de volta.",
  },
  "transaction.import.review.removeConfirm.submit": {
    en: "Remove row",
    "pt-BR": "Remover linha",
  },

  "transaction.import.issue.missingDescription": {
    en: "Description is missing",
    "pt-BR": "Falta a descrição",
  },
  "transaction.import.issue.invalidAmount": {
    en: "The amount could not be read",
    "pt-BR": "Não foi possível ler o valor",
  },
  "transaction.import.issue.invalidType": {
    en: "Type must be income or expense",
    "pt-BR": "O tipo deve ser income ou expense",
  },
  "transaction.import.issue.invalidDate": {
    en: "The date could not be read — use YYYY-MM-DD",
    "pt-BR": "Não foi possível ler a data — use AAAA-MM-DD",
  },
  "transaction.import.issue.missingAccount": {
    en: "Pick the wallet or card this row belongs to",
    "pt-BR": "Escolha a carteira ou o cartão desta linha",
  },
  "transaction.import.issue.unknownAccount": {
    en: "No wallet or card is named “{name}”",
    "pt-BR": "Nenhuma carteira ou cartão se chama “{name}”",
  },
  "transaction.import.issue.ambiguousAccount": {
    en: "More than one account is named “{name}” — pick one",
    "pt-BR": "Mais de uma conta se chama “{name}” — escolha uma",
  },
  "transaction.import.issue.unknownCategory": {
    en: "No {type} category is named “{name}”",
    "pt-BR": "Nenhuma categoria de {type} se chama “{name}”",
  },
  "transaction.import.issue.ambiguousCategory": {
    en: "More than one category is named “{name}” — pick one",
    "pt-BR": "Mais de uma categoria se chama “{name}” — escolha uma",
  },
  "transaction.import.issue.cardRowIncome": {
    en: "A row on a card is a purchase — income needs a wallet",
    "pt-BR": "Uma linha em um cartão é uma compra — receita precisa de uma carteira",
  },

  "transaction.import.toast.imported": {
    en: "Transactions imported",
    "pt-BR": "Transações importadas",
  },
} as const satisfies MessageTable;
