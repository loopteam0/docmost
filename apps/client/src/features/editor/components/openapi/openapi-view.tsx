import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ActionIcon,
  Alert,
  Card,
  Group,
  LoadingOverlay,
  Text,
} from "@mantine/core";
import { IconApi, IconEdit, IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { useDisclosure } from "@mantine/hooks";
import { fetchOpenApiSpec } from "@/features/editor/services/openapi-service.ts";
import { ResizableWrapper } from "../common/resizable-wrapper";
import OpenApiSourceModal from "./openapi-source-modal";
import classes from "./openapi-view.module.css";

export default function OpenApiView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, selected, updateAttributes, editor } = props;
  const { sourceType, attachmentId, src, url, title, height } = node.attrs;

  const [opened, { open, close }] = useDisclosure(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // @ts-ignore
  const pageId = editor.storage?.pageId;

  useEffect(() => {
    if (!sourceType) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (sourceType === "attachment") {
          const res = await fetch(src);
          if (!res.ok) throw new Error("Failed to load spec");
          const text = await res.text();
          if (!cancelled) setContent(text);
        } else if (sourceType === "url") {
          const result = await fetchOpenApiSpec(url, pageId);
          if (!cancelled) setContent(result.content);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              t("Failed to load OpenAPI spec"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [sourceType, src, url, pageId, reloadToken]);

  const configuration = useMemo(
    () => ({ content: content ?? "", title }),
    [content, title],
  );

  const handleResize = (_width: number, newHeight: number) => {
    updateAttributes({ height: newHeight });
  };

  const handleSourceSet = (attrs: Record<string, any>) => {
    updateAttributes(attrs);
  };

  if (!sourceType) {
    return (
      <NodeViewWrapper data-drag-handle className={classes.container}>
        <Card
          radius="md"
          onClick={editor.isEditable ? open : undefined}
          p="xs"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: editor.isEditable ? "pointer" : "default",
          }}
          withBorder
          className={clsx(selected ? "ProseMirror-selectednode" : "")}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <ActionIcon variant="transparent" color="gray" aria-label={t("Add OpenAPI spec")}>
              <IconApi size={18} />
            </ActionIcon>
            <Text component="span" size="lg" c="dimmed">
              {t("Click to add an OpenAPI / Swagger spec")}
            </Text>
          </div>
        </Card>

        <OpenApiSourceModal
          opened={opened}
          onClose={close}
          pageId={pageId}
          attachmentId={attachmentId}
          onSourceSet={handleSourceSet}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper data-drag-handle className={classes.container}>
      <ResizableWrapper
        initialWidth={800}
        initialHeight={height || 600}
        minWidth={200}
        maxWidth={1200}
        minHeight={300}
        maxHeight={2000}
        onResize={handleResize}
        isEditable={editor.isEditable}
        selected={selected}
        className={clsx(classes.wrapper, {
          "ProseMirror-selectednode": selected,
        })}
      >
        <div className={classes.panel} style={{ position: "relative" }}>
          <Group justify="space-between" p="xs" className={classes.header}>
            <Text size="sm" fw={500} c="dimmed" truncate>
              {title || t("OpenAPI specification")}
            </Text>
            <Group gap={4}>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={t("Reload spec")}
                onClick={() => setReloadToken((v) => v + 1)}
              >
                <IconRefresh size={16} />
              </ActionIcon>
              {editor.isEditable && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={t("Edit source")}
                  onClick={open}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              )}
            </Group>
          </Group>

          <LoadingOverlay visible={loading} />

          {error && (
            <Alert color="red" m="xs" title={t("Unable to load spec")}>
              {error}
            </Alert>
          )}

          {!loading && !error && content && (
            <ApiReferenceReact configuration={configuration} />
          )}
        </div>
      </ResizableWrapper>

      <OpenApiSourceModal
        opened={opened}
        onClose={close}
        pageId={pageId}
        attachmentId={attachmentId}
        onSourceSet={handleSourceSet}
      />
    </NodeViewWrapper>
  );
}
