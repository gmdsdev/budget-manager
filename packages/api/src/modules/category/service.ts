import type { CategoryFormDto, CategoryType } from "@budget-manager/schemas";
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
      throw new NotFoundError("error.notFound.category");
    }

    return category;
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
