
import { Card, CardHeader } from "@/components/ui/card";

export function SettingsSection({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      {children}
      {footer}
    </Card>
  );
}
