import { useRef, useState } from "react";
import {
  Button,
  FileButton,
  Group,
  Modal,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { z } from "zod/v4";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { uploadFile } from "@/features/page/services/page-service.ts";
import { fetchOpenApiSpec } from "@/features/editor/services/openapi-service.ts";
import { IAttachment } from "@/features/attachments/types/attachment.types";
import { OpenApiAttributes } from "@docmost/editor-ext";

const urlSchema = z.object({
  url: z.url({ message: i18n.t("Please enter a valid url") }).trim(),
});

function extractSpecTitle(content: string): string | undefined {
  try {
    return JSON.parse(content)?.info?.title;
  } catch {
    return undefined;
  }
}

interface OpenApiSourceModalProps {
  opened: boolean;
  onClose: () => void;
  pageId: string;
  attachmentId?: string;
  onSourceSet: (attrs: OpenApiAttributes) => void;
}

export default function OpenApiSourceModal({
  opened,
  onClose,
  pageId,
  attachmentId,
  onSourceSet,
}: OpenApiSourceModalProps) {
  const { t } = useTranslation();
  const [pasteText, setPasteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileResetRef = useRef<() => void>(null);

  const urlForm = useForm<{ url: string }>({
    initialValues: { url: "" },
    validate: zod4Resolver(urlSchema),
  });

  async function saveAsAttachment(content: string, fileName: string) {
    setIsSubmitting(true);
    try {
      const mimeType =
        fileName.endsWith(".yaml") || fileName.endsWith(".yml")
          ? "application/yaml"
          : "application/json";
      const file = new File([content], fileName, { type: mimeType });

      const attachment: IAttachment = attachmentId
        ? await uploadFile(file, pageId, attachmentId)
        : await uploadFile(file, pageId);

      onSourceSet({
        sourceType: "attachment",
        attachmentId: attachment.id,
        src: `/api/files/${attachment.id}/${attachment.fileName}?t=${new Date(attachment.updatedAt).getTime()}`,
        fileName: attachment.fileName,
        title: extractSpecTitle(content),
        url: undefined,
      });
      onClose();
    } catch (err: any) {
      notifications.show({
        color: "red",
        message:
          err?.response?.data?.message || t("Failed to save OpenAPI spec"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    const isJson = (() => {
      try {
        JSON.parse(pasteText);
        return true;
      } catch {
        return false;
      }
    })();
    await saveAsAttachment(pasteText, isJson ? "spec.json" : "spec.yaml");
  }

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    const content = await file.text();
    await saveAsAttachment(content, file.name);
  }

  async function handleUrlSubmit(data: { url: string }) {
    setIsSubmitting(true);
    try {
      const result = await fetchOpenApiSpec(data.url, pageId);
      onSourceSet({
        sourceType: "url",
        url: data.url,
        title: extractSpecTitle(result.content),
        attachmentId: undefined,
        src: undefined,
        fileName: undefined,
      });
      onClose();
    } catch (err: any) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message || t("Unable to fetch the URL"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("Add OpenAPI / Swagger spec")}
      size="lg"
    >
      <Tabs defaultValue="paste" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="paste">{t("Paste spec")}</Tabs.Tab>
          <Tabs.Tab value="upload">{t("Upload file")}</Tabs.Tab>
          <Tabs.Tab value="url">{t("Load from URL")}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="paste" pt="md">
          <Textarea
            placeholder={t(
              "Paste your OpenAPI/Swagger spec as JSON or YAML",
            )}
            autosize
            minRows={10}
            maxRows={16}
            value={pasteText}
            onChange={(e) => setPasteText(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="sm">
            <Button
              onClick={handlePasteSubmit}
              loading={isSubmitting}
              disabled={!pasteText.trim()}
            >
              {t("Save")}
            </Button>
          </Group>
        </Tabs.Panel>

        <Tabs.Panel value="upload" pt="md">
          <Group justify="center" py="xl">
            <FileButton
              onChange={handleFileUpload}
              accept=".json,.yaml,.yml,application/json,application/yaml"
              resetRef={fileResetRef}
            >
              {(props) => (
                <Button {...props} loading={isSubmitting}>
                  {t("Choose file")}
                </Button>
              )}
            </FileButton>
          </Group>
          <Text size="sm" c="dimmed" ta="center">
            {t("JSON or YAML files only")}
          </Text>
        </Tabs.Panel>

        <Tabs.Panel value="url" pt="md">
          <form onSubmit={urlForm.onSubmit(handleUrlSubmit)}>
            <TextInput
              placeholder={t("https://example.com/openapi.json")}
              key={urlForm.key("url")}
              {...urlForm.getInputProps("url")}
              data-autofocus
            />
            <Group justify="flex-end" mt="sm">
              <Button type="submit" loading={isSubmitting}>
                {t("Load spec")}
              </Button>
            </Group>
          </form>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
