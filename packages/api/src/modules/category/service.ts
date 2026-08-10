import type { Locale } from "@budget-manager/i18n";
import type { CategoryFormDto, CategoryType } from "@budget-manager/schemas";
import {
  defaultCategoriesForLocale,
  defaultCategoryRenames,
} from "@budget-manager/schemas";
import { ConflictError, NotFoundError } from "../../errors";
import type {
  CategoryFilters,
  CategoryRepository,
  CategoryUpdatePatch,
} from "./repository";

export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async getAll({
    userId,
    includeArchived,
    limit,
    offset,
    ...filters
  }: CategoryFilters & {
    userId: string;
    includeArchived: boolean;
    limit: number;
    offset: number;
  }) {
    const [rows, total] = await Promise.all([
      this.repository.getAll({
        userId,
        includeArchived,
        limit,
        offset,
        ...filters,
      }),
      this.repository.count({ userId, includeArchived, ...filters }),
    ]);

    return { rows, total, limit, offset };
  }

  async getOptions({
    userId,
    type,
  }: {
    userId: string;
    type?: CategoryType;
  }) {
    return await this.repository.listOptions({ userId, type });
  }

  /**
   * Writes the default set in the language onboarding saved, and is safe to
   * save again: an account that already has categories gets nothing inserted.
   * The one re-run that still acts is a language change over a set the user
   * has not touched — that renames the defaults in place rather than laying a
   * second language beside them, and the moment the user has renamed, added or
   * removed anything the set is theirs and re-runs leave it alone.
   */
  async ensureDefaults({ userId, locale }: { userId: string; locale: Locale }) {
    const existing = await this.repository.listIdentities({ userId });

    if (existing.length === 0) {
      const created = await this.repository.createMany({
        userId,
        categories: defaultCategoriesForLocale(locale),
      });

      return { created: created.length, renamed: 0 };
    }

    const renames = defaultCategoryRenames(existing, locale);
    const idByKey = new Map(
      existing.map((row) => [
        `${row.type}:${row.name.trim().toLowerCase()}`,
        row.id,
      ]),
    );

    for (const rename of renames) {
      const id = idByKey.get(
        `${rename.from.type}:${rename.from.name.trim().toLowerCase()}`,
      );

      if (id) {
        await this.repository.update({
          id,
          userId,
          patch: { name: rename.toName },
        });
      }
    }

    return { created: 0, renamed: renames.length };
  }

  async create({
    userId,
    category,
  }: {
    userId: string;
    category: CategoryFormDto;
  }) {
    const created = await this.repository.create({ userId, category });

    if (!created) {
      throw new Error("Category insert returned no row");
    }

    return created;
  }

  async update({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: CategoryUpdatePatch;
  }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.category");
    }

    await this.assertTypeStillFree({ id, existing, patch });

    const category = await this.repository.update({ id, userId, patch });

    if (!category) {
      throw new NotFoundError("error.notFound.category");
    }

    return category;
  }

  /**
   * A category's type is what every other rule reads it through: a transaction
   * may only carry a category of its own type, and only an expense category may
   * carry a budget. Flipping it under rows that already exist would leave them
   * in a state `create` refuses to produce, so it is settled at creation and
   * held from the first row that references it — the same bargain as delete.
   */
  private async assertTypeStillFree({
    id,
    existing,
    patch,
  }: {
    id: string;
    existing: { type: CategoryType };
    patch: CategoryUpdatePatch;
  }) {
    // The form gives an enum, the patch a plain string; compare as strings.
    const currentType: string = existing.type;

    if (patch.type === undefined || patch.type === currentType) {
      return;
    }

    const references = await this.repository.countReferences({ id });

    if (references > 0) {
      throw new ConflictError("error.conflict.categoryTypeInUse", {
        references,
      });
    }
  }

  async archive({ id, userId }: { id: string; userId: string }) {
    const category = await this.repository.archive({ id, userId });

    if (!category) {
      throw new NotFoundError("error.notFound.category");
    }

    return category;
  }

  async unarchive({ id, userId }: { id: string; userId: string }) {
    const category = await this.repository.unarchive({ id, userId });

    if (!category) {
      throw new NotFoundError("error.notFound.category");
    }

    return category;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.category");
    }

    const references = await this.repository.countReferences({ id });

    if (references > 0) {
      throw new ConflictError("error.conflict.categoryInUse", { references });
    }

    await this.repository.delete({ id, userId });

    return { id };
  }
}
