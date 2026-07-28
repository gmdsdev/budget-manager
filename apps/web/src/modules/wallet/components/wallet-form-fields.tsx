import { Field, FieldGroup } from "@budget-manager/ui/components/field";
import { Input } from "@budget-manager/ui/components/input";
import { Label } from "@budget-manager/ui/components/label";
import { UseAccountFormReturnType } from "../hooks/use-account-form";

export function WalletFormFields({ form }: { form: UseAccountFormReturnType }) {
  return (
    <FieldGroup>
      <form.Field name="name">
        {(field) => (
          <Field>
            <Label htmlFor={field.name}>Name</Label>
            <Input
              id={field.name}
              name={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className={
                field.state.meta.errors.length > 0 ? "border-destructive" : ""
              }
            />
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
    </FieldGroup>
  );
}
