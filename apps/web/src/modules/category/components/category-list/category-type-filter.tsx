import { CategoryType, CategoryTypeLabelMap } from "@budget-manager/schemas";
import {
  Field,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import {
  CATEGORY_TYPE_FILTER_ALL,
  type CategoryTypeFilterValue,
} from "../../types";

const CATEGORY_TYPE_FILTER_ITEMS: {
  label: string;
  value: CategoryTypeFilterValue;
}[] = [
  { label: "All types", value: CATEGORY_TYPE_FILTER_ALL },
  ...Object.values(CategoryType).map((type) => ({
    label: CategoryTypeLabelMap[type],
    value: type,
  })),
];

export function CategoryTypeFilter({
  value,
  onValueChange,
}: {
  value: CategoryTypeFilterValue;
  onValueChange: (value: CategoryTypeFilterValue) => void;
}) {
  return (
    <Field orientation="horizontal" className="w-auto">
      <FieldLabel htmlFor="category-type-filter">Type</FieldLabel>
      <Select<CategoryTypeFilterValue>
        items={CATEGORY_TYPE_FILTER_ITEMS}
        id="category-type-filter"
        value={value}
        onValueChange={(next) => onValueChange(next as CategoryTypeFilterValue)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_TYPE_FILTER_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
