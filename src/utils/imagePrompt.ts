const generationInstruction = (subject: string) =>
  `Generate an image based on information provided about the ${subject}. Make it epic, fitting for fantasy. Make in the style of a painting. Do not include any text in the image, simply generate the image based on the information provided below.`;

type ImagePromptField = { label: string; value?: string | null };

type ImagePromptInput = {
  subject: string;
  fields: ImagePromptField[];
};

export function buildImagePrompt({ subject, fields }: ImagePromptInput): string {
  const lines = fields
    .filter((field) => field.value)
    .map((field) => `${field.label}: ${field.value}`);

  return [generationInstruction(subject), ...lines].join('\n');
}
