import {
  useCreateSpaceMutation,
  useSpaceTemplatesQuery,
} from "@/features/space/queries/space-query.ts";
import { computeSpaceSlug } from "@/lib";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import {
  Badge,
  Box,
  Button,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as z from "zod";
import classes from "./create-space-form.module.css";
import { ISpaceTemplate } from "@/features/space/types/space.types.ts";

const step1Schema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(
      /^[a-zA-Z0-9]+$/,
      "Space slug must be alphanumeric. No special characters",
    ),
  description: z.string().max(500),
});

const formSchema = step1Schema.extend({
  templateId: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onClose?: () => void;
}

function TemplateCard({
  tpl,
  isSelected,
  onToggle,
}: {
  tpl: ISpaceTemplate;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <UnstyledButton
      className={`${classes.templateCard} ${isSelected ? classes.templateCardSelected : ""}`}
      onClick={onToggle}
    >
      <Text size="xl" mb={4}>
        {tpl.icon}
      </Text>
      <Group gap={4} align="center" wrap="nowrap">
        <Text size="sm" fw={600} lh={1.2} style={{ flexShrink: 0 }}>
          {t(tpl.name)}
        </Text>
        {!tpl.isSystem && (
          <Badge size="xs" variant="light" color="violet">
            {t("Custom")}
          </Badge>
        )}
      </Group>
      <Text size="xs" c="dimmed" mt={2} lh={1.3}>
        {tpl.description}
      </Text>
      {isSelected && tpl.pages && tpl.pages.length > 0 && (
        <Text size="xs" c="dimmed" mt={6}>
          {tpl.pages.slice(0, 3).join(" · ")}
          {tpl.pages.length > 3 ? ` +${tpl.pages.length - 3}` : ""}
        </Text>
      )}
    </UnstyledButton>
  );
}

export function CreateSpaceForm({ onClose }: Props) {
  const { t } = useTranslation();
  const createSpaceMutation = useCreateSpaceMutation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { data: templates, isLoading: templatesLoading } =
    useSpaceTemplatesQuery();

  const form = useForm<FormValues>({
    validate: zodResolver(formSchema),
    validateInputOnChange: ["slug"],
    initialValues: {
      name: "",
      slug: "",
      description: "",
      templateId: null,
    },
  });

  useEffect(() => {
    const name = form.values.name;
    const words = name.trim().split(/\s+/);
    const lastChar = name[name.length - 1];
    const lastWordIsIncomplete =
      words.length > 1 && words[words.length - 1].length === 1;

    if (lastChar !== " " || lastWordIsIncomplete) {
      form.setFieldValue("slug", computeSpaceSlug(name));
    }
  }, [form.values.name]);

  const handleNext = () => {
    const result = form.validate();
    const step1Fields = ["name", "slug", "description"] as const;
    const hasStep1Errors = step1Fields.some((f) => result.errors[f]);
    if (!hasStep1Errors) setStep(1);
  };

  const handleSubmit = async (data: FormValues) => {
    const createdSpace = await createSpaceMutation.mutateAsync({
      name: data.name,
      slug: data.slug,
      description: data.description,
      templateId: data.templateId ?? undefined,
    });

    onClose?.();

    if (createdSpace.initialPageSlugId) {
      navigate(buildPageUrl(createdSpace.slug, createdSpace.initialPageSlugId));
    } else {
      navigate("/s/" + createdSpace.slug);
    }
  };

  const selectedId = form.values.templateId;

  return (
    <Box>
      <Stepper active={step} mb="lg" size="sm">
        <Stepper.Step label={t("Details")} />
        <Stepper.Step label={t("Template")} />
      </Stepper>

      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
        {step === 0 && (
          <Stack gap="md">
            <TextInput
              withAsterisk
              autoFocus
              label={t("Space name")}
              placeholder={t("e.g Product Team")}
              variant="filled"
              data-autofocus
              errorProps={{ role: "alert" }}
              {...form.getInputProps("name")}
            />

            <TextInput
              withAsterisk
              label={t("Space slug")}
              placeholder={t("e.g product")}
              variant="filled"
              errorProps={{ role: "alert" }}
              {...form.getInputProps("slug")}
            />

            <Textarea
              label={t("Space description")}
              placeholder={t("e.g Space for product team")}
              variant="filled"
              autosize
              minRows={2}
              maxRows={6}
              {...form.getInputProps("description")}
            />

            <Group justify="flex-end" mt="xs">
              <Button onClick={handleNext}>{t("Next")}</Button>
            </Group>
          </Stack>
        )}

        {step === 1 && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed" mb="sm">
                {t(
                  "Pick a template to pre-fill your space with relevant starter pages, or skip to start blank.",
                )}
              </Text>

              {templatesLoading ? (
                <Group justify="center" py="xl">
                  <Loader size="sm" />
                </Group>
              ) : (
                <SimpleGrid cols={3} spacing="xs">
                  {(templates ?? []).map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      tpl={tpl}
                      isSelected={selectedId === tpl.id}
                      onToggle={() =>
                        form.setFieldValue(
                          "templateId",
                          selectedId === tpl.id ? null : tpl.id,
                        )
                      }
                    />
                  ))}
                </SimpleGrid>
              )}
            </div>

            <Group justify="space-between" mt="xs">
              <Button variant="subtle" onClick={() => setStep(0)}>
                {t("Back")}
              </Button>
              <Button type="submit" loading={createSpaceMutation.isPending}>
                {selectedId ? t("Create with template") : t("Create blank")}
              </Button>
            </Group>
          </Stack>
        )}
      </form>
    </Box>
  );
}
