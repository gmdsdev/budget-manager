import {
  fieldErrors,
  isFieldInvalid,
  type UseCategoryFormReturnType,
  useEnumLabels,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { type CategoryColor, CategoryType } from "@budget-manager/schemas";

import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { CategoryColorPicker } from "./category-color-picker";

export function CategoryFormFields({
  form,
}: {
  form: UseCategoryFormReturnType;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();

  const typeItems = Object.values(CategoryType).map((type) => ({
    label: labels.categoryType(type),
    value: type,
  }));

  return (
    <FieldGroup>
      <form.Field name="name">
        {(field) => (
          <Field label={t("common.name")} errors={fieldErrors(field)}>
            <Input
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("common.name")}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="type">
        {(field) => (
          <Field label={t("common.type")} errors={fieldErrors(field)}>
            <Select
              label={t("common.type")}
              items={typeItems}
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => field.handleChange(value as CategoryType)}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="color">
        {(field) => (
          <Field label={t("category.field.color")} errors={fieldErrors(field)}>
            <CategoryColorPicker
              value={field.state.value}
              onValueChange={(color: CategoryColor) => field.handleChange(color)}
            />
          </Field>
        )}
      </form.Field>
    </FieldGroup>
  );
}
