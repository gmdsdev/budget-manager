import type { MessageTable } from "./table";

export const category = {
  "category.title": { en: "Categories", "pt-BR": "Categorias" },
  "category.caption": { en: "Your categories", "pt-BR": "Suas categorias" },
  "category.loading": {
    en: "Loading categories",
    "pt-BR": "Carregando categorias",
  },
  "category.loadFailed": {
    en: "Couldn't load your categories",
    "pt-BR": "Não foi possível carregar suas categorias",
  },
  "category.emptyFiltered.title": {
    en: "No categories match these filters",
    "pt-BR": "Nenhuma categoria corresponde a estes filtros",
  },
  "category.emptyFiltered.description": {
    en: "Try a different type or name, or create a category for it.",
    "pt-BR": "Tente outro tipo ou nome, ou crie uma categoria para isso.",
  },
  "category.empty.title": {
    en: "No categories yet",
    "pt-BR": "Nenhuma categoria ainda",
  },
  "category.empty.description": {
    en: "Create your first category to classify your transactions.",
    "pt-BR": "Crie sua primeira categoria para classificar suas transações.",
  },

  "category.field.color": { en: "Color", "pt-BR": "Cor" },
  "category.filter.allTypes": { en: "All types", "pt-BR": "Todos os tipos" },
  "category.uncategorized": {
    en: "Uncategorized",
    "pt-BR": "Sem categoria",
  },

  "category.create.trigger": {
    en: "Create Category",
    "pt-BR": "Criar categoria",
  },
  "category.create.title": { en: "Create Category", "pt-BR": "Criar categoria" },
  "category.create.description": {
    en: "Create a new category to classify your income and expenses.",
    "pt-BR": "Crie uma nova categoria para classificar receitas e despesas.",
  },
  "category.create.submit": {
    en: "Create category",
    "pt-BR": "Criar categoria",
  },

  "category.edit.title": { en: "Edit Category", "pt-BR": "Editar categoria" },
  "category.edit.description": {
    en: "Update the details for “{name}”.",
    "pt-BR": "Atualize os dados de “{name}”.",
  },

  "category.archive.title": {
    en: "Archive “{name}”?",
    "pt-BR": "Arquivar “{name}”?",
  },
  "category.archive.description": {
    en: "This {type} category will be hidden from your list. Transactions already using it keep their category, and you can restore it later.",
    "pt-BR":
      "Esta categoria de {type} será ocultada da sua lista. As transações que já a usam mantêm sua categoria, e você pode restaurá-la depois.",
  },
  "category.archive.submit": {
    en: "Archive category",
    "pt-BR": "Arquivar categoria",
  },
  "category.archive.submitting": { en: "Archiving…", "pt-BR": "Arquivando…" },

  "category.toast.created": {
    en: "Category created successfully",
    "pt-BR": "Categoria criada com sucesso",
  },
  "category.toast.updated": {
    en: "Category updated successfully",
    "pt-BR": "Categoria atualizada com sucesso",
  },
  "category.toast.archived": {
    en: "Category archived",
    "pt-BR": "Categoria arquivada",
  },
  "category.toast.restored": {
    en: "Category restored",
    "pt-BR": "Categoria restaurada",
  },
  "category.toast.deleted": {
    en: "Category deleted successfully",
    "pt-BR": "Categoria excluída com sucesso",
  },
} as const satisfies MessageTable;
