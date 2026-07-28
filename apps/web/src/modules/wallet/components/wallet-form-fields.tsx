import { Field, FieldGroup } from "@budget-manager/ui/components/field";
import { Input } from "@budget-manager/ui/components/input";
import { Label } from "@budget-manager/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import { UseWalletFormReturnType } from "../hooks/use-wallet-form";
import { WalletType, WalletTypeLabelMap } from "@budget-manager/schemas";

export function WalletFormFields({ form }: { form: UseWalletFormReturnType }) {
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
      <form.Field name="type">
        {(field) => (
          <Field>
            <Label htmlFor={field.name}>Type</Label>
            <Select
              items={Object.values(WalletType).map((type) => ({
                label: WalletTypeLabelMap[type],
                value: type,
              }))}
              id={field.name}
              name={field.name}
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as WalletType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(WalletType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {WalletTypeLabelMap[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Field name="balance">
        {(field) => (
          <Field>
            <Label htmlFor={field.name}>Balance</Label>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(Number(e.target.value))}
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
      <form.Field name="currency">
        {(field) => (
          <Field>
            <Label htmlFor={field.name}>Currency</Label>
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
