import {
  buildImportTemplateCsv,
  readImportCsv,
  type ImportCsvError,
  type ImportCsvRow,
} from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { toast } from "@/lib/toast";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

type UploadError = ImportCsvError | { error: "unreadable" };

type PickedFile = { name: string; uri: string };

/**
 * Step one: the example file and the picker. Parsing happens here, on the device —
 * tRPC speaks JSON, so the file never travels; only the reviewed rows do.
 *
 * A phone has no downloads folder, so the template is handed to the share sheet
 * instead: "Save to Files", AirDrop or mail it to the machine the CSV will actually
 * be built on. It is the same file the web downloads, written to the cache under the
 * same localized name.
 */
export function ImportUploadCard({
  onRows,
}: {
  onRows: (rows: ImportCsvRow[]) => void;
}) {
  const t = useTranslate();
  const colors = useColors();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [error, setError] = useState<UploadError | null>(null);

  async function shareTemplate() {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        toast.error(t("transaction.import.template.shareFailed"));

        return;
      }

      const target = new File(
        Paths.cache,
        t("transaction.import.template.fileName"),
      );

      target.create({ overwrite: true });
      target.write(buildImportTemplateCsv());

      await Sharing.shareAsync(target.uri, {
        mimeType: "text/csv",
        UTI: "public.comma-separated-values-text",
        dialogTitle: t("transaction.import.template.share"),
      });
    } catch {
      toast.error(t("transaction.import.template.shareFailed"));
    }
  }

  async function pick() {
    setError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        // A bank export is routinely served as text/plain, so filtering on text/csv
        // alone would hide the very file the reader came here with.
        type: ["text/csv", "text/comma-separated-values", "text/plain"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (asset) {
        setFile({ name: asset.name, uri: asset.uri });
      }
    } catch {
      setError({ error: "unreadable" });
    }
  }

  async function submit() {
    if (!file) {
      return;
    }

    let text: string;

    try {
      text = await new File(file.uri).text();
    } catch {
      setError({ error: "unreadable" });

      return;
    }

    const read = readImportCsv(text);

    if ("rows" in read) {
      onRows(read.rows);
    } else {
      setError(read);
    }
  }

  const errorMessage =
    error === null
      ? null
      : error.error === "missingColumns"
        ? t("transaction.import.error.missingColumns", {
            columns: error.columns.join(", "),
          })
        : error.error === "tooManyRows"
          ? t("transaction.import.error.tooManyRows", { max: error.max })
          : error.error === "unreadable"
            ? t("transaction.import.error.unreadable")
            : t("transaction.import.error.emptyFile");

  return (
    <View style={{ gap: SPACING.lg }}>
      <Card>
        <CardHeader
          title={t("transaction.import.template.title")}
          description={t("transaction.import.template.hint")}
        />
        <Button
          variant="outline"
          label={t("transaction.import.template.share")}
          leading={
            <Feather name="share" size={16} color={colors.foreground} />
          }
          onPress={() => void shareTemplate()}
        />
      </Card>

      <Card>
        <CardHeader title={t("transaction.import.upload.title")} />

        <Button
          variant="secondary"
          label={t("transaction.import.upload.choose")}
          leading={
            <Feather
              name="upload"
              size={16}
              color={colors.secondaryForeground}
            />
          }
          onPress={() => void pick()}
        />

        <Text variant="meta" tone="muted" numberOfLines={2}>
          {file ? file.name : t("transaction.import.upload.noFile")}
        </Text>

        {errorMessage ? (
          <Text variant="meta" tone="destructive" accessibilityRole="alert">
            {errorMessage}
          </Text>
        ) : null}

        <Button
          label={t("transaction.import.upload.submit")}
          disabled={!file}
          onPress={() => void submit()}
        />
      </Card>
    </View>
  );
}
