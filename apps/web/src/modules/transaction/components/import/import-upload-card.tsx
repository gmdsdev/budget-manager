import {
  buildImportTemplateCsv,
  readImportCsv,
  type ImportCsvError,
  type ImportCsvRow,
} from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { FileArrowDownIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";

type UploadError = ImportCsvError | { error: "unreadable" };

/**
 * Step one: the example file and the picker. Parsing happens here, client
 * side — tRPC speaks JSON, so the file never travels; only the reviewed rows
 * do.
 */
export function ImportUploadCard({
  onRows,
}: {
  onRows: (rows: ImportCsvRow[]) => void;
}) {
  const t = useTranslate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<UploadError | null>(null);

  function downloadTemplate() {
    const blob = new Blob([buildImportTemplateCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = t("transaction.import.template.fileName");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function submit() {
    if (!file) {
      return;
    }

    let text: string;

    try {
      text = await file.text();
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
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("transaction.import.template.title")}</CardTitle>
          <CardDescription>
            {t("transaction.import.template.hint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadTemplate}>
            <FileArrowDownIcon aria-hidden />
            {t("transaction.import.template.download")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("transaction.import.upload.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label={t("transaction.import.upload.choose")}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              <UploadSimpleIcon aria-hidden />
              {t("transaction.import.upload.choose")}
            </Button>
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {file ? file.name : t("transaction.import.upload.noFile")}
            </span>
          </div>
          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button disabled={!file} onClick={() => void submit()}>
            {t("transaction.import.upload.submit")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
