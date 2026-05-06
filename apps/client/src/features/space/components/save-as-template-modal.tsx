import { useCreateSpaceTemplateMutation } from "@/features/space/queries/space-query.ts";
import { ISpace } from "@/features/space/types/space.types.ts";
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

interface Props {
  space: ISpace;
  opened: boolean;
  onClose: () => void;
}

export default function SaveAsTemplateModal({ space, opened, onClose }: Props) {
  const { t } = useTranslation();
  const createTemplate = useCreateSpaceTemplateMutation();

  const form = useForm({
    initialValues: {
      name: space.name,
      description: space.description ?? "",
      icon: "📄",
    },
    validate: {
      name: (v) =>
        v.trim().length < 2 ? t("Name must be at least 2 characters") : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await createTemplate.mutateAsync({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      icon: values.icon.trim() || undefined,
      spaceId: space.id,
    });
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("Save space as template")}
      size="sm"
    >
      <Text size="sm" c="dimmed" mb="md">
        {t(
          "This will save the current structure of this space as a reusable template. All workspace members will be able to use it when creating a new space.",
        )}
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label={t("Template name")}
            placeholder={space.name}
            variant="filled"
            {...form.getInputProps("name")}
          />

          <Textarea
            label={t("Description")}
            placeholder={t("Describe what this template is for")}
            variant="filled"
            autosize
            minRows={2}
            maxRows={4}
            {...form.getInputProps("description")}
          />

          <TextInput
            label={t("Icon")}
            placeholder="📄"
            variant="filled"
            maxLength={4}
            {...form.getInputProps("icon")}
          />
        </Stack>

        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button type="submit" loading={createTemplate.isPending}>
            {t("Save template")}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
