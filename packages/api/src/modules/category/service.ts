import type { CategoryFormDto, CategoryType } from "@budget-manager/schemas";
import { ConflictError, NotFoundError } from "../../errors";
import type { CategoryRepository, CategoryUpdatePatch } from "./repository";

export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async getAll({
    userId,
    type,
    includeArchived,
    limit,
    offset,
  }: {
    userId: string;
    type?: CategoryType;
    includeArchived: boolean;
    limit: number;
    offset: number;
  }) {
    const [rows, total] = await Promise.all([
      this.repository.getAll({ userId, type, includeArchived, limit, offset }),
      this.repository.count({ userId, type, includeArchived }),
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
    const category = await this.repository.update({ id, userId, patch });

    if (!category) {
      throw new NotFoundError("Category");
    }

    return category;
  }

  async archive({ id, userId }: { id: string; userId: string }) {
    const category = await this.repository.archive({ id, userId });

    if (!category) {
      throw new NotFoundError("Category");
    }

    return category;
  }

  async unarchive({ id, userId }: { id: string; userId: string }) {
    const category = await this.repository.unarchive({ id, userId });

    if (!category) {
      throw new NotFoundError("Category");
    }

    return category;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("Category");
    }

    const references = await this.repository.countReferences({ id });

    if (references > 0) {
      throw new ConflictError(
        `This category is used by ${references} record(s). Archive it instead of deleting.`,
      );
    }

    await this.repository.delete({ id, userId });

    return { id };
  }
}
