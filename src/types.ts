export interface PromptType {
    prompt: string;
    negativePrompt: string;
    modelId: string;
    taskId?: string | undefined;
    // @deprecated
    imageUrl?: string | undefined;
}
